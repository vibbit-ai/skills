#!/usr/bin/env node
'use strict'

const fs = require('node:fs/promises')
const { constants } = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { resolveAccount, resolveCredential } = require('./lib/auth-store')
const { createClient, VibbitError } = require('./lib/client')
const { commands } = require('./lib/registry')
const { status, loadState } = require('./lib/tasks')
const { separationResult } = require('./lib/audio-separation')

const check = (condition, message) => { if (!condition) throw new VibbitError('input', message) }
const binding = (key, base, picker) => crypto.createHmac('sha256', key).update(base + '\n' + picker).digest('hex')
async function context(region) {
  const account = await resolveAccount({ region })
  const credential = await resolveCredential({ account })
  check(credential.key, 'Connect the Vibbit business account before preparing audio tracks')
  return { base: account.base, key: credential.key, client: createClient(credential) }
}
async function readPrivate(file) {
  check(file && path.isAbsolute(file), 'Use an absolute private file path')
  const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    check(stat.isFile() && stat.size <= 1024 * 1024 && (process.platform === 'win32' || (stat.uid === process.getuid() && !(stat.mode & 0o077))), 'Audio state must be a private regular file')
    return JSON.parse(await handle.readFile('utf8'))
  } finally { await handle.close() }
}
async function newSnapshot(file, value) {
  check(file && path.isAbsolute(file), 'Use an absolute new snapshot path')
  const parent = await fs.realpath(path.dirname(file)), root = await fs.realpath(path.resolve(__dirname, '..'))
  const relative = path.relative(root, parent)
  check(relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative), 'Keep audio snapshots outside the installed Skill')
  await fs.writeFile(file, JSON.stringify(value) + '\n', { flag: 'wx', mode: 0o600 })
}
async function main(argv, { getContext = context, queryStatus = status } = {}) {
  const [command, ...args] = argv
  if (!command || ['help', '--help'].includes(command)) return { tool: 'vibbit_show_audio_tracks', usage: [
    'prepare --journal ORIGINAL_TASK_JOURNAL --state NEW_PRIVATE_SNAPSHOT [--region cn|global]',
    'resolve --state PRIVATE_SNAPSHOT --event EVENT_JSON_FILE [--region cn|global]',
  ], note: 'Prepare refreshes the original task with GET only. Pass returned arguments unchanged. Never resubmit a separation to refresh signed downloads.' }
  check(['prepare', 'resolve'].includes(command), 'Use prepare or resolve')
  const flags = {}
  for (let i = 0; i < args.length; i += 2) {
    check(['--journal', '--state', '--event', '--region'].includes(args[i]) && args[i + 1] && !Object.hasOwn(flags, args[i]), 'Invalid or duplicate audio-tracks option')
    flags[args[i]] = args[i + 1]
  }
  check(command === 'prepare' ? flags['--journal'] && !flags['--event'] : flags['--event'] && !flags['--journal'], 'prepare requires --journal; resolve requires --event')
  const { base, key, client } = await getContext(flags['--region'])
  if (command === 'prepare') {
    await readPrivate(flags['--journal'])
    const journal = await loadState(flags['--journal'], base)
    check(journal.command === 'separate_audio' && /^task-\d+$/.test(journal.task_id) && Number.isInteger(journal.separation_model), 'Use the original separation journal with its submitted model')
    const output = await queryStatus(client, journal.task_id, { ...commands.separate_audio, separation_model: journal.separation_model })
    check(output.status === 'COMPLETED', 'Separation is still processing; resume the original task before displaying tracks')
    const separation = separationResult(output.result, journal.separation_model)
    const pickerId = crypto.randomUUID()
    const tracks = separation.tracks.map(track => {
      const url = new URL(track.audio_url)
      check(url.protocol === 'https:' && !url.username && !url.password, 'Audio cards require HTTPS result URLs; keep the original result as file fallback')
      return { id: crypto.randomUUID(), ...track }
    })
    const snapshot = { version: 1, base, pickerId, binding: binding(key, base, pickerId), taskId: journal.task_id, model: journal.separation_model, tracks }
    await newSnapshot(flags['--state'], snapshot)
    return { tool: 'vibbit_show_audio_tracks', state_file: flags['--state'], arguments: { schemaVersion: 1, pickerId,
      taskId: journal.task_id, model: journal.separation_model,
      tracks: tracks.map(track => ({ id: track.id, stem: track.stem, audioUrl: track.audio_url })) } }
  }
  const state = await readPrivate(flags['--state']), event = await readPrivate(flags['--event'])
  check(state.version === 1 && state.base === base && state.binding === binding(key, base, state.pickerId), 'Audio snapshot belongs to another account or site; prepare a new snapshot with the original task')
  check(event && Object.keys(event).every(key => ['schemaVersion', 'type', 'pickerId', 'taskId', 'trackIds'].includes(key))
    && event.schemaVersion === 1 && event.type === 'audio_tracks.selected' && event.pickerId === state.pickerId && event.taskId === state.taskId
    && Array.isArray(event.trackIds) && event.trackIds.length > 0 && event.trackIds.length <= state.tracks.length
    && new Set(event.trackIds).size === event.trackIds.length && event.trackIds.every(id => state.tracks.some(track => track.id === id)), 'Audio selection does not belong to this snapshot')
  return { ok: true, task_id: state.taskId, model: state.model,
    tracks: event.trackIds.map(id => state.tracks.find(track => track.id === id)), selection_only: true,
    refresh: 'If a download expires, prepare a new snapshot from the original journal; no new submission is needed.' }
}
if (require.main === module) main(process.argv.slice(2)).then(result => process.stdout.write(JSON.stringify(result) + '\n')).catch(error => {
  // Do not include payloads or signed URLs in diagnostics.
  process.stderr.write(JSON.stringify({ ok: false, kind: error.kind || 'audio_tracks', message: error instanceof VibbitError ? error.message : 'Audio track snapshot could not be read or prepared' }) + '\n'); process.exitCode = 1
})
module.exports = { main }
