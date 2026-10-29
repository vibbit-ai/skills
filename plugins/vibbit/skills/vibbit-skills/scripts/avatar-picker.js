#!/usr/bin/env node
'use strict'

const fs = require('node:fs/promises')
const { constants } = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { main: runCli } = require('./vibbit')
const { resolveAccount, resolveCredential } = require('./lib/auth-store')
const { VibbitError } = require('./lib/client')
const { parseJson } = require('./lib/json')
const { previewUrl } = require('./lib/preview')

function ensure(condition, message) {
  if (!condition) throw new VibbitError('input', message)
}

function exactId(value) {
  ensure(typeof value === 'string' || Number.isSafeInteger(value), 'Avatar ID must be an exact string or a safe integer')
  const id = String(value)
  ensure(id.trim() === id && id.length > 0 && id.length <= 128 && !/[\u0000-\u001f\u007f]/.test(id), 'Invalid avatar ID')
  return id
}

function prepare(result, pickerId = crypto.randomUUID()) {
  ensure(result?.ok === true && result.status === 'COMPLETED' && Array.isArray(result.result), 'A completed digital-human list is required; continue the original task if still pending')
  const ids = new Set()
  const items = result.result.map(row => {
    const id = exactId(row?.id)
    ensure(!ids.has(id), 'Duplicate avatar ID; do not guess the selected record')
    ids.add(id)
    const name = typeof row.name === 'string' && row.name.trim() ? row.name : `Unnamed avatar (${id})`
    const item = { id, name: name.length > 300 ? name.slice(0, 299) + '…' : name }
    // Use the original row as authority; never zip the shorter previews array by index.
    if (typeof row.cover === 'string') {
      const preview = previewUrl(row.cover)
      try {
        const url = new URL(preview)
        if (url.protocol === 'https:' && !url.username && !url.password &&
          !/[\u0000-\u0020\\]/.test(preview) && preview.length <= 4096) item.previewUrl = preview
      } catch { /* A missing or invalid cover does not remove the person. */ }
    }
    return item
  })
  return { schemaVersion: 1, pickerId, items }
}

const binding = (key, salt) => crypto.createHmac('sha256', key).update(salt).digest('hex')

async function readSnapshot(file) {
  const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    ensure(stat.isFile() && stat.size <= 10 * 1024 * 1024, 'Invalid picker snapshot')
    if (process.platform !== 'win32') ensure(stat.uid === process.getuid() && !(stat.mode & 0o077), 'Picker snapshot must be private to the current user')
    return parseJson(await handle.readFile('utf8'))
  } finally { await handle.close() }
}

async function main(argv, { query = runCli, env = process.env } = {}) {
  const [command, ...tokens] = argv
  if (command === '--help' || command === 'help') return { usage: 'query --state ABSOLUTE_FILE [--region REGION]; resolve --state ABSOLUTE_FILE --picker-id ID --id AVATAR_ID [--region REGION]', tool: 'vibbit_show_avatar_picker', api_key_argument: false }
  ensure(['query', 'resolve'].includes(command), 'Use query --state ABSOLUTE_FILE [--region REGION], or resolve --state ABSOLUTE_FILE --picker-id ID --id AVATAR_ID [--region REGION]')
  const flags = {}
  for (let i = 0; i < tokens.length; i += 2) {
    const key = tokens[i].replace(/^--/, '')
    ensure(tokens[i].startsWith('--') && ['state', 'region', 'picker-id', 'id'].includes(key) && !flags[key] && tokens[i + 1] && !tokens[i + 1].startsWith('--'), 'Invalid or duplicate option')
    flags[key] = tokens[i + 1]
  }
  ensure(flags.state && path.isAbsolute(flags.state), '--state must be an absolute local path outside the Skill package')
  const parent = await fs.realpath(path.dirname(flags.state))
  const skillRoot = await fs.realpath(path.resolve(__dirname, '..'))
  const relative = path.relative(skillRoot, parent)
  ensure(relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative),
    'Keep picker snapshots outside the installed Skill package')
  const account = await resolveAccount({ env, region: flags.region })
  const credential = await resolveCredential({ env, account })
  ensure(credential.key, 'Configure credentials in the host before querying or resolving an avatar')
  if (command === 'query') {
    ensure(!flags.id && !flags['picker-id'], 'Selection flags apply only to resolve')
    // Exclusive creation prevents a new list from silently replacing an older picker.
    const handle = await fs.open(flags.state, 'wx', 0o600)
    let saved = false
    try {
      const result = await query(['list_digital_humans', ...(flags.region ? ['--region', flags.region] : [])])
      if (result.status !== 'COMPLETED') return result
      const input = prepare(result)
      const snapshot = { version: 1, createdAt: new Date().toISOString(), base: account.base,
        credentialBinding: binding(credential.key, input.pickerId), input, result }
      await handle.writeFile(JSON.stringify(snapshot) + '\n')
      await handle.sync()
      saved = true
      ensure(input.items.length <= 200 && Buffer.byteLength(JSON.stringify(input)) <= 512 * 1024,
        'Picker limit exceeded (200 people / 512 KiB); use the complete list in the local snapshot for text/file fallback')
      return { ok: true, state_file: flags.state, tool: 'vibbit_show_avatar_picker', arguments: input }
    } finally {
      await handle.close()
      // Keep completed snapshots (including oversized lists) for fallback. Pending
      // queries already carry their own task journal; an empty picker is not usable.
      if (!saved) await fs.rm(flags.state, { force: true })
    }
  }
  ensure(flags.id && flags['picker-id'], 'resolve requires --picker-id and --id from the current selection')
  const saved = await readSnapshot(flags.state)
  ensure(saved.version === 1 && saved.input?.pickerId === flags['picker-id'], 'Selection belongs to a different list')
  ensure(saved.base === account.base && saved.credentialBinding === binding(credential.key, saved.input.pickerId), 'Account or environment changed; query a new list')
  const input = prepare(saved.result, saved.input.pickerId)
  const selected = input.items.find(item => item.id === flags.id)
  ensure(selected, 'Selected ID is not in this list')
  const row = saved.result.result.find(item => exactId(item.id) === selected.id)
  return { ok: true, pickerId: input.pickerId, digital_human_id: selected.id,
    record: { ...row, id: selected.id }, ...(selected.previewUrl ? { preview_url: selected.previewUrl } : {}) }
}

if (require.main === module) main(process.argv.slice(2)).then(
  result => { process.stdout.write(JSON.stringify(result, null, 2) + '\n') },
  error => { process.stdout.write(JSON.stringify({ ok: false, error: { kind: error.kind || 'configuration', message: error.message } }) + '\n'); process.exitCode = 2 },
)

module.exports = { main, prepare, exactId }
