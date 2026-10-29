'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

function detectHosts(opts = {}, deps = {}) {
  const platform = deps.platform || process.platform
  const env = deps.env || process.env
  const home = deps.home || os.homedir()
  const paths = platform === 'win32' ? path.win32 : path.posix
  const isFile = deps.isFile || (file => {
    try { return fs.statSync(file).isFile() } catch (error) {
      if (['ENOENT', 'ENOTDIR'].includes(error.code)) return false
      throw error
    }
  })
  const candidates = { codex: [env.CODEX_APP_RUNTIME_CLI_PATH], workbuddy: [env.WORKBUDDY_CLI_PATH] }
  if (platform === 'darwin') {
    for (const base of ['/Applications', paths.join(home, 'Applications')]) {
      candidates.codex.push(
        paths.join(base, 'ChatGPT.app/Contents/Resources/codex-cli/bin/codex'),
        paths.join(base, 'Codex.app/Contents/Resources/codex'),
        paths.join(base, 'Codex.app/Contents/Resources/codex-cli/bin/codex')
      )
      candidates.workbuddy.push(paths.join(base, 'WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy'))
    }
  }
  if (platform === 'win32') {
    const bases = [env.LOCALAPPDATA && paths.join(env.LOCALAPPDATA, 'Programs'), env.ProgramFiles].filter(Boolean)
    for (const base of bases) {
      candidates.codex.push(
        paths.join(base, 'Codex/resources/codex.exe'),
        paths.join(base, 'Codex/resources/codex-cli/bin/codex.exe'),
        paths.join(base, 'ChatGPT/resources/codex-cli/bin/codex.exe')
      )
      candidates.workbuddy.push(paths.join(base, 'WorkBuddy/resources/app.asar.unpacked/cli/bin/codebuddy'))
    }
  }
  const pathValue = env.PATH || env.Path || ''
  for (let directory of pathValue.split(platform === 'win32' ? ';' : ':').filter(Boolean)) {
    directory = directory.replace(/^"(.*)"$/, '$1')
    candidates.codex.push(paths.join(directory, platform === 'win32' ? 'codex.exe' : 'codex'))
  }
  const hosts = opts.host && opts.host !== 'auto' && opts.host !== 'all' ? [opts.host] : ['codex', 'workbuddy']
  const found = []
  for (const host of hosts) {
    const explicit = opts[`${host}-cli`]
    // An explicit path is a constraint, never a reason to silently skip a client.
    if (explicit) {
      const file = paths.resolve(explicit)
      if (!isFile(file)) throw new Error(`${host} CLI 路径不存在：${file}`)
      found.push({ host, cli: file })
      continue
    }
    const file = candidates[host].filter(Boolean).find(isFile)
    if (file) found.push({ host, cli: paths.resolve(file) })
    else if (opts.host && opts.host !== 'auto') throw new Error(`未找到 ${host}，请先安装客户端，或用 --${host}-cli 指定其 CLI 路径。`)
  }
  if (!found.length) throw new Error('未找到 Codex 或 WorkBuddy。请先安装至少一个客户端；非标准安装位置可用 --codex-cli 或 --workbuddy-cli 指定。')
  return found
}

module.exports = { detectHosts }
