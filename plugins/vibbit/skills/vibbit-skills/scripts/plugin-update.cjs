#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const zlib = require('node:zlib')
const { spawn, spawnSync } = require('node:child_process')

const repository = 'vibbit-ai/skills'
const manifestUrl = `https://raw.githubusercontent.com/${repository}/main/plugins/latest.json`
const hosts = ['codex', 'workbuddy', 'claude', 'openclaw']
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'))
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
  const temp = `${file}.${process.pid}.tmp`
  fs.writeFileSync(temp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 })
  fs.renameSync(temp, file)
}
function compareVersions(a, b) {
  if (![a, b].every(value => typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value))) throw new Error('Invalid stable plugin version')
  const aa = a.split('.').map(Number), bb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (aa[i] !== bb[i]) return aa[i] > bb[i] ? 1 : -1
  return 0
}
async function download(url, maxBytes, timeout = 10000) {
  const signal = AbortSignal.timeout(timeout)
  for (let i = 0; i < 6; i++) {
    const target = new URL(url)
    if (target.protocol !== 'https:' || target.username || target.password || !['raw.githubusercontent.com', 'github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com'].includes(target.hostname)) throw new Error('Untrusted update download origin')
    const response = await fetch(target, { signal, redirect: 'manual', headers: { 'User-Agent': 'vibbit-plugin-updater', Accept: 'application/octet-stream' } })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel()
      url = new URL(response.headers.get('location'), target).href
      continue
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Update download HTTP ${response.status}`) }
    if (Number(response.headers.get('content-length')) > maxBytes) { await response.body?.cancel(); throw new Error('Update download exceeds size limit') }
    const chunks = []
    let bytes = 0
    for await (const chunk of response.body) {
      bytes += chunk.length
      if (bytes > maxBytes) { await response.body.cancel().catch(() => {}); throw new Error('Update download exceeds size limit') }
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }
  throw new Error('Too many update redirects')
}
function validateManifest(value) {
  if (value.schemaVersion !== 1 || value.repository !== repository) throw new Error('Invalid update manifest')
  compareVersions(value.version, '0.0.0')
  const expected = `https://github.com/${repository}/releases/download/v${value.version}/vibbit-ai-plugin-installer-${value.version}.tgz`
  if (value.archive?.url !== expected || !/^[a-f0-9]{64}$/.test(value.archive.sha256)) throw new Error('Invalid update archive or checksum')
  return value
}
async function latest(fetchBytes = download) {
  return validateManifest(JSON.parse((await fetchBytes(manifestUrl, 65536)).toString('utf8')))
}
function extractArchive(archive, destination) {
  const tar = zlib.gunzipSync(archive, { maxOutputLength: 40 * 1024 * 1024 })
  const names = new Set()
  let offset = 0
  const text = (header, start, size) => header.subarray(start, start + size).toString('utf8').split('\0')[0]
  const number = value => {
    if (!/^[0-7]+$/.test(value.trim())) throw new Error('Invalid archive number')
    return parseInt(value.trim(), 8)
  }
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512)
    if (header.every(byte => byte === 0)) break
    const checksum = number(text(header, 148, 8))
    let actual = 0
    for (let i = 0; i < 512; i++) actual += i >= 148 && i < 156 ? 32 : header[i]
    if (actual !== checksum) throw new Error('Invalid archive header checksum')
    const prefix = text(header, 345, 155)
    const name = (prefix ? `${prefix}/` : '') + text(header, 0, 100)
    const size = number(text(header, 124, 12))
    const type = text(header, 156, 1)
    if (!['', '0', '5'].includes(type)) throw new Error('Archive links and extended entries are not supported')
    if (!name.startsWith('package/') || /[\\\x00-\x1f]/.test(name) || name.split('/').some(part => part === '..' || part === '.')) throw new Error('Unsafe archive path')
    const relative = name.slice(8).replace(/\/$/, '')
    if (!relative && type !== '5') throw new Error('Invalid archive root')
    if (names.has(relative) || names.size > 10000) throw new Error('Duplicate or excessive archive entries')
    names.add(relative)
    const end = offset + 512 + size
    if (end > tar.length) throw new Error('Truncated archive')
    const target = path.join(destination, relative)
    if (type === '5') fs.mkdirSync(target, { recursive: true, mode: 0o700 })
    else {
      fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 })
      const mode = number(text(header, 100, 8)) & 0o111 ? 0o755 : 0o644
      fs.writeFileSync(target, tar.subarray(offset + 512, end), { flag: 'wx', mode })
    }
    offset += 512 + Math.ceil(size / 512) * 512
  }
  if (!fs.existsSync(path.join(destination, 'install.cjs'))) throw new Error('Archive has no complete plugin installer')
}
function installProcess(entry, args, env = process.env, timeout = 120000) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entry, ...args], { env, shell: false, detached: process.platform !== 'win32', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = '', timedOut = false, killer
    const stop = () => {
      timedOut = true
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true, shell: false, timeout: 10000 })
      else {
        try { process.kill(-child.pid, 'SIGTERM') } catch {}
        killer = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL') } catch {} }, 300)
      }
    }
    const timer = setTimeout(stop, timeout)
    process.once('SIGTERM', stop)
    process.once('SIGINT', stop)
    const cleanup = () => { clearTimeout(timer); clearTimeout(killer); process.removeListener('SIGTERM', stop); process.removeListener('SIGINT', stop) }
    child.stdout.on('data', chunk => { if (output.length < 1024 * 1024) output += chunk.toString() })
    child.stderr.resume()
    child.on('error', () => { cleanup(); reject(new Error('Unable to start plugin installer')) })
    child.on('close', code => {
      clearTimeout(timer)
      if (timedOut) {
        // Kill any remaining members before allowing production to continue.
        if (process.platform !== 'win32') { try { process.kill(-child.pid, 'SIGKILL') } catch {} }
        cleanup()
        reject(new Error('Plugin update timed out; update processes stopped'))
      } else { cleanup(); resolve({ code, output }) }
    })
  })
}
function context(skillDir, storeOverride) {
  const root = path.resolve(skillDir, '..', '..')
  const source = readJson(path.join(root, 'update-source.json'))
  const version = readJson(path.join(skillDir, 'package.json')).version
  compareVersions(version, '0.0.0')
  if (source.schemaVersion !== 1 || source.repository !== repository || source.version !== version || !['stable', 'pinned'].includes(source.channel)) throw new Error('Untracked plugin installation')
  if (!hosts.includes(source.host) || typeof source.profileId !== 'string' || !Array.isArray(source.installArgs) || source.installArgs.some(arg => typeof arg !== 'string')) throw new Error('Untracked host installation')
  const allowed = new Set(['--codex-cli', '--workbuddy-cli', '--workbuddy-config', '--claude-cli', '--openclaw-cli', '--codex-socket', '--workbuddy-url'])
  for (let i = 0; i < source.installArgs.length; i += 2) if (!allowed.has(source.installArgs[i]) || !source.installArgs[i + 1] || source.installArgs[i + 1].startsWith('--')) throw new Error('Invalid tracked host options')
  const envNames = new Set(['CODEX_HOME', 'CLAUDE_CONFIG_DIR', 'CLAUDE_CODE_PLUGIN_CACHE_DIR', 'OPENCLAW_HOME', 'OPENCLAW_STATE_DIR', 'OPENCLAW_CONFIG_PATH'])
  if (!source.profileEnv || typeof source.profileEnv !== 'object' || Array.isArray(source.profileEnv) || Object.entries(source.profileEnv).some(([key, value]) => !envNames.has(key) || typeof value !== 'string' || !path.isAbsolute(value))) throw new Error('Invalid tracked host profile')
  const store = path.resolve(storeOverride || source.store || path.join(os.homedir(), '.vibbit-installer'))
  return { source, version, root, store }
}
function acquireLock(lock) {
  fs.mkdirSync(path.dirname(lock), { recursive: true, mode: 0o700 })
  try { fs.mkdirSync(lock, { mode: 0o700 }); return true } catch (error) { if (error.code !== 'EEXIST') throw error }
  // A host can stop the checker during a download. Recover only a lock whose
  // recorded owner is definitely gone; access errors do not authorize recovery.
  try {
    const file = path.join(lock, 'owner.json')
    const before = fs.statSync(lock)
    const owner = fs.readFileSync(file, 'utf8')
    const pid = JSON.parse(owner).pid
    if (!Number.isSafeInteger(pid) || pid <= 0) return false
    try { process.kill(pid, 0); return false } catch (error) { if (error.code !== 'ESRCH') return false }
    if (fs.statSync(lock).ino !== before.ino || fs.readFileSync(file, 'utf8') !== owner) return false
    fs.rmSync(lock, { recursive: true })
    fs.mkdirSync(lock, { mode: 0o700 })
    return true
  } catch { return false }
}
async function update(skillDir, opts = {}, deps = {}) {
  const env = deps.env || process.env
  if (opts.auto && env.VIBBIT_AUTO_UPDATE === '0') return { state: 'disabled' }
  let current
  try { current = context(skillDir, opts.store) } catch { return { state: 'untracked', continueLocal: true } }
  const { source, version, store } = current
  if (source.channel === 'pinned' && !opts.check) return { state: 'pinned', version }
  const session = opts.session || env.CODEX_THREAD_ID || env.CODEX_SESSION_ID || env.CLAUDE_CODE_SESSION_ID || env.WORKBUDDY_SESSION_ID || env.CODEBUDDY_SESSION_ID || env.OPENCLAW_SESSION_ID
  const sessionFile = session && path.join(store, 'update-checks', hash(`${source.profileId}\0${session}`) + '.json')
  if (opts.auto && sessionFile) {
    try { fs.mkdirSync(path.dirname(sessionFile), { recursive: true, mode: 0o700 }); fs.writeFileSync(sessionFile, JSON.stringify({ attemptedAt: new Date().toISOString() }), { flag: 'wx', mode: 0o600 }) }
    catch (error) { if (error.code === 'EEXIST') return { state: 'already_checked' }; return { state: 'unavailable', continueLocal: true } }
  }
  let staging, lock
  try {
    const remote = await latest(deps.download || download)
    if (compareVersions(remote.version, version) <= 0) return { state: 'current', version, latest: remote.version }
    if (opts.check) return { state: 'available', version, latest: remote.version }
    lock = path.join(store, 'update-locks', hash(source.profileId))
    if (!acquireLock(lock)) { lock = undefined; return { state: 'busy', continueLocal: true } }
    writeJson(path.join(lock, 'owner.json'), { pid: process.pid, startedAt: new Date().toISOString() })
    const archive = await (deps.download || download)(remote.archive.url, 12 * 1024 * 1024, 30000)
    if (hash(archive) !== remote.archive.sha256) throw new Error('Plugin archive checksum mismatch')
    const parent = path.join(store, 'updates')
    fs.mkdirSync(parent, { recursive: true, mode: 0o700 })
    staging = fs.mkdtempSync(path.join(parent, '.update-'))
    extractArchive(archive, staging)
    if (readJson(path.join(staging, 'plugin.json')).version !== remote.version) throw new Error('Plugin archive version mismatch')
    const resultFile = path.join(staging, 'update-result.json')
    const args = ['install', '--host', source.host, ...source.installArgs, '--store', store, '--update-channel', 'stable', '--automatic', '--result-file', resultFile]
    const result = await (deps.installProcess || installProcess)(path.join(staging, 'install.cjs'), args, { ...env, ...source.profileEnv })
    if (![0, 2].includes(result.code) || !fs.existsSync(resultFile)) throw new Error('Complete plugin installer did not confirm the update')
    const receipt = readJson(resultFile)
    if (receipt.version !== remote.version || receipt.hosts?.length !== 1 || receipt.hosts[0].host !== source.host || !receipt.hosts[0].installed) throw new Error('Updated plugin receipt does not match the target')
    return { state: receipt.hosts[0].activeClientVerified ? 'updated' : 'updated_pending_reload', version: remote.version, skillDir: receipt.hosts[0].skillDir, continueLocal: !receipt.hosts[0].activeClientVerified }
  } catch (error) {
    return { state: 'unavailable', version, continueLocal: true, reason: error.message }
  } finally {
    if (staging) fs.rmSync(staging, { recursive: true, force: true })
    if (lock) fs.rmSync(lock, { recursive: true, force: true })
  }
}
async function main(argv = process.argv.slice(2)) {
  const command = argv.shift() || 'auto'
  if (!['auto', 'check', 'update'].includes(command)) throw new Error('Use auto, check or update')
  const opts = { auto: command === 'auto', check: command === 'check' }
  for (let i = 0; i < argv.length; i++) {
    if (!['--session', '--store'].includes(argv[i]) || !argv[i + 1]) throw new Error('Invalid updater option')
    opts[argv[i].slice(2)] = argv[++i]
  }
  const result = await update(path.resolve(__dirname, '..'), opts)
  console.log(JSON.stringify(result))
  return 0 // Best effort: a failed update must not reject an otherwise usable Skill.
}
if (require.main === module) main().then(code => { process.exitCode = code }, error => { console.error(error.message); process.exitCode = 1 })
module.exports = { compareVersions, validateManifest, latest, download, extractArchive, context, update, installProcess, writeJson, hash }
