#!/usr/bin/env node
'use strict'

const fs = require('node:fs/promises')
const { constants } = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')
const { main: runCli } = require('./vibbit')
const { resolveAccount, resolveCredential } = require('./lib/auth-store')
const { VibbitError } = require('./lib/client')
const { parseJson } = require('./lib/json')
const { previewUrl } = require('./lib/preview')
const { validate } = require('./lib/schemas')

const ensure = (condition, message) => { if (!condition) throw new VibbitError('input', message) }
const binding = (key, salt) => crypto.createHmac('sha256', key).update(salt).digest('hex')
const fields = { name: 'name', mediaType: 'media_type', collectionName: 'collection_name', tags: 'tag_names',
  tagMatchMode: 'tag_match_mode', category: 'category', classificationSource: 'classification_source', page: 'page', pageSize: 'page_size' }

function exactId(value) {
  ensure(typeof value === 'string' || Number.isSafeInteger(value), 'Material ID must be exact')
  const id = String(value)
  ensure(/^[1-9][0-9]{0,18}$/.test(id) && BigInt(id) <= 9223372036854775807n, 'Invalid material ID')
  return id
}

function safeUrl(value) {
  if (typeof value !== 'string') return undefined
  const converted = previewUrl(value)
  try {
    const url = new URL(converted)
    if (url.protocol === 'https:' && !url.username && !url.password && converted.length <= 4096 &&
      !/[\u0000-\u0020\\]/.test(converted) && url.hostname !== 'willing-video-test.oss-cn-shanghai.aliyuncs.com') return converted
  } catch { /* Invalid preview URLs do not remove a material. */ }
}

function fromApi(input) {
  return Object.fromEntries(Object.entries({ ...input, page: input.page ?? 1, page_size: input.page_size ?? 20 })
    .map(([key, value]) => [Object.entries(fields).find(([, api]) => api === key)?.[0], value])
    .filter(([key, value]) => key && value !== undefined))
}

function toApi(query) {
  ensure(query && typeof query === 'object' && !Array.isArray(query), 'Invalid browse query')
  ensure(Object.keys(query).every(key => Object.hasOwn(fields, key)), 'Unsupported browse field')
  const result = Object.fromEntries(Object.entries(query).map(([key, value]) => [fields[key], value]))
  return validate('list_materials', result).input
}

function materialItem(row, detail) {
    const id = exactId(row.material_id)
    ensure(['IMAGE', 'VIDEO', 'AUDIO'].includes(row.media_type), 'Unsupported material type')
    const originalName = typeof row.material_name === 'string' && row.material_name.trim() ? row.material_name : `Unnamed material (${id})`
    const item = { id, name: originalName.length > 300 ? originalName.slice(0, 299) + '…' : originalName, mediaType: row.media_type }
    const cover = safeUrl(row.cover_url), media = safeUrl(detail?.file_info?.url)
    if (cover) item.previewUrl = cover
    if (media) item.mediaUrl = media
    if (Number.isFinite(detail?.file_info?.duration) && detail.file_info.duration >= 0) item.duration = detail.file_info.duration
    if (typeof row.collection_name === 'string' && row.collection_name.trim() && row.collection_name.length <= 300) item.collectionName = row.collection_name
    const tags = [...new Set([...(row.tags?.AI ?? []), ...(row.tags?.MANUAL ?? [])])]
      .filter(tag => typeof tag === 'string' && tag.trim() && tag.length <= 300).slice(0, 50)
    if (tags.length) item.tags = tags
    return item
}

function prepare(result, details, input, mode = 'multiple', maxSelection = mode === 'single' ? 1 : 100, pickerId = crypto.randomUUID()) {
  ensure(result?.ok === true && result.status === 'COMPLETED' && Array.isArray(result.result?.items), 'A completed material list is required')
  const ids = new Set()
  const items = result.result.items.map(row => {
    const id = exactId(row.material_id)
    ensure(!ids.has(id), 'Duplicate material ID')
    ids.add(id)
    return materialItem(row, details.get(id))
  })
  return { schemaVersion: 1, pickerId, selectionMode: mode, maxSelection, query: fromApi(input),
    total: result.result.total, hasMore: result.result.has_more, items }
}

function displayDetail(record, request) {
  const result = { id: exactId(record.material_id), tab: request.tab === 'analysis' ? 'info' : request.tab,
    segmentPage: request.segmentPage, segmentPageSize: request.segmentPageSize, fileInfo: {} }
  const texts = (source, mapping) => Object.fromEntries(Object.entries(mapping)
    .filter(([key]) => typeof source?.[key] === 'string' && source[key].trim())
    .map(([key, field]) => [field, source[key]]))
  const times = source => Object.fromEntries([['start_time', 'startTime'], ['end_time', 'endTime']]
    .filter(([key]) => typeof source?.[key] === 'number' && Number.isFinite(source[key]) && source[key] >= 0)
    .map(([key, field]) => [field, source[key]]))
  const ref = value => {
    if (value === undefined || value === null) return undefined
    ensure(typeof value === 'string' || Number.isSafeInteger(value), 'Scene/segment IDs must preserve their original precision')
    const id = String(value)
    ensure(id.trim() && id.length <= 300, 'Invalid scene/segment identifier')
    return id
  }
  const segment = value => ({
    ...(ref(value.segment_id) !== undefined ? { id: ref(value.segment_id) } : {}),
    ...(ref(value.scene_id) !== undefined ? { sceneId: ref(value.scene_id) } : {}),
    ...times(value), ...texts(value, { content: 'content', caption: 'caption', transcript: 'transcript' }),
    ...(safeUrl(value.url) ? { mediaUrl: safeUrl(value.url) } : {}),
  })
  const file = record.file_info ?? {}
  Object.assign(result.fileInfo, texts(file, {file_name: 'fileName', file_type: 'fileType', mime_type: 'mimeType',
    upload_time: 'uploadTime', video_codec: 'videoCodec', audio_codec: 'audioCodec', container_format: 'containerFormat'}))
  for (const [key, field] of Object.entries({ duration: 'duration', width: 'width', height: 'height', frame_rate: 'frameRate' })) {
    if (typeof file[key] === 'number' && Number.isFinite(file[key]) && (key === 'duration' ? file[key] >= 0 : file[key] > 0) &&
      (!['width', 'height'].includes(key) || Number.isSafeInteger(file[key]))) result.fileInfo[field] = file[key]
  }
  if ((typeof file.file_size === 'string' && /^(0|[1-9][0-9]{0,18})$/.test(file.file_size)) ||
      (Number.isSafeInteger(file.file_size) && file.file_size >= 0)) result.fileInfo.fileSize = String(file.file_size)
  Object.assign(result, texts(record, {description: 'description', analysis_status: 'analysisStatus', analysis_failure_reason: 'analysisFailureReason'}))
  for (const key of ['tags', 'classifications']) {
    if (record[key]) {
      for (const source of ['AI', 'MANUAL']) ensure(Array.isArray(record[key][source]) && record[key][source].length <= 100 &&
        record[key][source].every(value => typeof value === 'string' && value.trim() && value.length <= 300), 'Material detail tags/classifications exceed display limits; use the full source detail')
      result[key] = { ai: record[key].AI, manual: record[key].MANUAL }
    }
  }
  if (record.analysis) {
    result.analysis = texts(record.analysis, {description: 'description', summary: 'summary', transcript: 'transcript'})
    if (Array.isArray(record.analysis.contents)) result.analysis.contents = record.analysis.contents.map(value => typeof value === 'string' ? value : segment(value))
    if (Array.isArray(record.analysis.scenes)) result.analysis.scenes = record.analysis.scenes.map(scene => {
      const displayed = { ...(ref(scene.scene_id) !== undefined ? {id: ref(scene.scene_id)} : {}),
        ...times(scene), ...texts(scene, {description: 'description'}) }
      if (scene.segments) {
        const page = scene.segments
        ensure(page.page === request.segmentPage && page.page_size === request.segmentPageSize &&
          Array.isArray(page.items) && page.items.length <= page.page_size &&
          (typeof page.total === 'string' || Number.isSafeInteger(page.total)) && /^(0|[1-9][0-9]{0,18})$/.test(String(page.total)) &&
          BigInt(page.total) >= BigInt(page.items.length) &&
          page.has_more === (BigInt(page.page) * BigInt(page.page_size) < BigInt(page.total)), 'Scene pagination differs from the requested page')
        displayed.segments = {items: page.items.map(segment), page: page.page, pageSize: page.page_size, total: String(page.total), hasMore: page.has_more}
      }
      return displayed
    })
  }
  ensure(Object.entries(result.fileInfo).every(([key, value]) => typeof value !== 'string' || value.length <= (key === 'fileName' ? 2000 : 300)), 'Material file metadata exceeds display limits')
  ensure((result.analysis?.scenes?.length ?? 0) <= 1000 && (result.analysis?.contents?.length ?? 0) <= 1000, 'Material analysis exceeds display limits; use the full source detail')
  return result
}

async function readPrivate(file) {
  const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    ensure(stat.isFile() && stat.size <= 10 * 1024 * 1024, 'Invalid picker snapshot')
    if (process.platform !== 'win32') ensure(stat.uid === process.getuid() && !(stat.mode & 0o077), 'Picker snapshot must be private')
    return parseJson(await handle.readFile('utf8'))
  } finally { await handle.close() }
}

async function outsideSkill(file) {
  ensure(file && path.isAbsolute(file), 'Snapshot paths must be absolute and outside the installed Skill')
  const parent = await fs.realpath(path.dirname(file))
  const root = await fs.realpath(path.resolve(__dirname, '..'))
  const relative = path.relative(root, parent)
  ensure(relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative), 'Keep snapshots outside the installed Skill')
}

async function main(argv, { query = runCli, env = process.env } = {}) {
  const [command, ...tokens] = argv
  if (['help', '--help'].includes(command)) return { tool: 'vibbit_show_material_picker', usage: [
    'query --state ABSOLUTE_NEW_FILE [--input LIST_FILTERS_JSON] [--mode single|multiple] [--max-selection 1..100] [--region cn|global]',
    'resolve --state SNAPSHOT --selection EVENT_JSON [--region cn|global]',
    'inspect --state SNAPSHOT --request EVENT_JSON --new-state ABSOLUTE_NEW_FILE [--region cn|global]',
    'browse --state SNAPSHOT --request EVENT_JSON --new-state ABSOLUTE_NEW_FILE [--region cn|global]',
  ], api_key_argument: false }
  ensure(['query', 'resolve', 'browse', 'inspect'].includes(command), 'Use query, resolve, browse or inspect; see --help')
  const flags = {}
  for (let i = 0; i < tokens.length; i += 2) {
    const key = tokens[i].replace(/^--/, '')
    ensure(tokens[i].startsWith('--') && ['state', 'input', 'mode', 'max-selection', 'region', 'selection', 'request', 'new-state'].includes(key) &&
      !Object.hasOwn(flags, key) && tokens[i + 1] && !tokens[i + 1].startsWith('--'), 'Invalid or duplicate option')
    flags[key] = tokens[i + 1]
  }
  const allowed = command === 'query' ? ['state', 'input', 'mode', 'max-selection', 'region'] : command === 'resolve'
    ? ['state', 'selection', 'region'] : ['state', 'request', 'new-state', 'region']
  ensure(Object.keys(flags).every(key => allowed.includes(key)), 'Option does not apply to this command')
  await outsideSkill(flags.state)
  const account = await resolveAccount({ env, region: flags.region })
  const credential = await resolveCredential({ env, account })
  ensure(credential.key, 'Configure the selected business account before browsing materials')
  const invoke = async (name, input) => {
    const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'vibbit-material-read-'))
    try {
      const file = path.join(temporary, 'input.json')
      await fs.writeFile(file, JSON.stringify(input), { mode: 0o600, flag: 'wx' })
      const result = await query([name, '--input', file, ...(flags.region ? ['--region', flags.region] : [])])
      ensure(result?.ok === true && result.status === 'COMPLETED' && result.account_base === account.base, 'Material query failed or account differs; do not invent candidates')
      return result
    } finally { await fs.rm(temporary, { recursive: true, force: true }) }
  }
  const detail = async (id, segmentPage = 1, segmentPageSize = 1) => {
    const result = await invoke('get_material', { material_id: id, segment_page: segmentPage, segment_page_size: segmentPageSize })
    ensure(exactId(result.result?.material_id) === id, 'Material detail ID differs from the selected ID')
    return result.result
  }
  let input, mode = flags.mode ?? 'multiple', maxSelection = flags['max-selection'] ? Number(flags['max-selection']) : mode === 'single' ? 1 : 100
  if (command !== 'query') {
    const saved = await readPrivate(flags.state)
    ensure(saved.version === 1 && saved.input?.pickerId && saved.base === account.base &&
      saved.credentialBinding === binding(credential.key, saved.input.pickerId), 'Account or environment changed; query a new list')
    const eventFile = flags.selection ?? flags.request
    ensure(eventFile && path.isAbsolute(eventFile), 'Use an absolute local event JSON file')
    const event = parseJson(await fs.readFile(eventFile, 'utf8'))
    ensure(event?.schemaVersion === 1 && event.pickerId === saved.input.pickerId, 'Event belongs to a different list')
    if (command === 'resolve') {
      ensure(event.type === 'materials.selected' && Object.keys(event).every(key => ['schemaVersion', 'type', 'pickerId', 'ids'].includes(key)), 'Invalid selection event')
      ensure(Array.isArray(event.ids) && event.ids.length > 0 && event.ids.length <= saved.input.maxSelection &&
        new Set(event.ids).size === event.ids.length && event.ids.every(id => typeof id === 'string' && saved.input.items.some(item => item.id === id)), 'Selected IDs must belong to the current page and respect the selection limit')
      const records = []
      // Refresh selected originals; cover URLs and stale signed links never replace file_info.url.
      for (const id of event.ids) records.push(await detail(id))
      return { ok: true, pickerId: event.pickerId, material_ids: event.ids, records }
    }
    if (command === 'inspect') {
      ensure(event.type === 'materials.inspect' && Object.keys(event).every(key => ['schemaVersion', 'type', 'pickerId', 'id', 'segmentPage', 'segmentPageSize', 'selectedIds', 'tab'].includes(key)), 'Invalid material detail event')
      ensure(typeof event.id === 'string' && saved.input.items.some(item => item.id === event.id), 'Material detail must belong to the current page')
      ensure(Array.isArray(event.selectedIds) && new Set(event.selectedIds).size === event.selectedIds.length &&
        event.selectedIds.length <= saved.input.maxSelection && event.selectedIds.every(id => typeof id === 'string' && saved.input.items.some(item => item.id === id)), 'Preserved selections must belong to the current page and respect the selection limit')
      ensure(Number.isSafeInteger(event.segmentPage) && event.segmentPage >= 1 && event.segmentPage < Number.MAX_SAFE_INTEGER &&
        Number.isInteger(event.segmentPageSize) && event.segmentPageSize >= 1 && event.segmentPageSize <= 100 &&
        ['info', 'analysis', 'segments'].includes(event.tab), 'Invalid material detail page or tab')
      const state = flags['new-state']
      await outsideSkill(state)
      const handle = await fs.open(state, 'wx', 0o600)
      let written = false
      try {
        const record = await detail(event.id, event.segmentPage, event.segmentPageSize)
        const pickerId = crypto.randomUUID()
        const arguments_ = { ...saved.input, pickerId, selectedIds: event.selectedIds,
          items: saved.input.items.map(item => item.id === event.id ? materialItem(record, record) : item),
          detail: displayDetail(record, event) }
        await handle.writeFile(JSON.stringify({ ...saved, createdAt: new Date().toISOString(), input: arguments_,
          credentialBinding: binding(credential.key, pickerId), detailRecord: record }) + '\n')
        await handle.sync(); written = true
        ensure(Buffer.byteLength(JSON.stringify(arguments_)) <= 512 * 1024, 'Material detail exceeds 512 KiB; use a smaller segment page or the complete saved private detail for text/file fallback')
        return {ok: true, state_file: state, tool: 'vibbit_show_material_picker', arguments: arguments_}
      } finally {
        await handle.close()
        if (!written) await fs.rm(state, {force: true})
      }
    }
    ensure(event.type === 'materials.browse' && Object.keys(event).every(key => ['schemaVersion', 'type', 'pickerId', 'query'].includes(key)), 'Invalid browse event')
    input = toApi(event.query)
    mode = saved.input.selectionMode; maxSelection = saved.input.maxSelection
    await outsideSkill(flags['new-state'])
  } else {
    input = flags.input ? parseJson(await fs.readFile(flags.input, 'utf8')) : {}
    input = validate('list_materials', input).input
  }
  ensure(['single', 'multiple'].includes(mode) && Number.isInteger(maxSelection) && maxSelection >= 1 && maxSelection <= 100 &&
    (mode !== 'single' || maxSelection === 1), 'Invalid selection mode or limit')
  input = { ...input, page: input.page ?? 1, page_size: input.page_size ?? 20 }
  const state = flags['new-state'] ?? flags.state
  const handle = await fs.open(state, 'wx', 0o600)
  let saved = false
  try {
    const result = await invoke('list_materials', input)
    ensure(Array.isArray(result.result?.items), 'Material list is missing items')
    const details = new Map(), unavailable = []
    // Bound read-only detail lookups so an entire page does not open unbounded requests.
    let cursor = 0
    await Promise.all(Array.from({ length: Math.min(4, result.result.items.length) }, async () => {
      while (cursor < result.result.items.length) {
        const row = result.result.items[cursor++]
        const id = exactId(row.material_id)
        try { details.set(id, await detail(id)) } catch { unavailable.push(id) }
      }
    }))
    const arguments_ = prepare(result, details, input, mode, maxSelection)
    await handle.writeFile(JSON.stringify({ version: 1, createdAt: new Date().toISOString(), base: account.base,
      credentialBinding: binding(credential.key, arguments_.pickerId), input: arguments_, result }) + '\n')
    await handle.sync(); saved = true
    ensure(arguments_.items.length <= 100 && Buffer.byteLength(JSON.stringify(arguments_)) <= 512 * 1024,
      'Material picker limit exceeded; narrow the query or use the complete saved snapshot as text/file fallback')
    return { ok: true, state_file: state, tool: 'vibbit_show_material_picker', arguments: arguments_,
      ...(unavailable.length ? { preview_unavailable_ids: unavailable } : {}) }
  } finally {
    await handle.close()
    if (!saved) await fs.rm(state, { force: true })
  }
}

if (require.main === module) main(process.argv.slice(2)).then(
  result => process.stdout.write(JSON.stringify(result, null, 2) + '\n'),
  error => { process.stdout.write(JSON.stringify({ ok: false, error: { kind: error.kind || 'configuration', message: error.message } }) + '\n'); process.exitCode = 2 },
)
module.exports = { main, prepare, displayDetail, exactId, safeUrl, fromApi, toApi }
