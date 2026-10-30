#!/usr/bin/env node
'use strict'

const fs = require('node:fs/promises')
const { constants } = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')
const { main: runCli } = require('./vibbit')
const { resolveAccount, resolveCredential } = require('./lib/auth-store')
const { parseJson } = require('./lib/json')
const { previewUrl } = require('./lib/preview')
const { validate } = require('./lib/schemas')
const { VibbitError } = require('./lib/client')

const ensure = (condition, message) => { if (!condition) throw new VibbitError('input', message) }
const hmac = (key, salt) => crypto.createHmac('sha256', key).update(salt).digest('hex')
const clipped = (value, max) => value.length > max ? value.slice(0, max - 1) + '…' : value

function exactId(value) {
  ensure(typeof value === 'string' || Number.isSafeInteger(value), 'Product ID must be exact')
  const id = String(value)
  ensure(/^[1-9][0-9]{0,18}$/.test(id) && BigInt(id) <= 9223372036854775807n, 'Invalid product ID')
  return id
}
function safeUrl(value) {
  if (typeof value !== 'string') return undefined
  const converted = previewUrl(value)
  try {
    const url = new URL(converted)
    if (url.protocol === 'https:' && !url.username && !url.password && converted.length <= 4096 &&
      url.hostname !== 'willing-video-test.oss-cn-shanghai.aliyuncs.com' && !/[\u0000-\u0020\\]/.test(converted)) return converted
  } catch { /* Missing or invalid images never remove a product. */ }
}
const originals = product => [...new Set([product.image_url, ...(Array.isArray(product.image_urls) ? product.image_urls : [])]
  .filter(value => typeof value === 'string' && value))]
function summary(product, knownImages = false) {
  const id = exactId(product.id)
  const name = typeof product.name === 'string' && product.name.trim() ? product.name : `Unnamed product (${id})`
  const result = { id, name: clipped(name, 300) }
  const cover = originals(product).map(safeUrl).find(Boolean)
  if (cover) result.previewUrl = cover
  if (typeof product.source === 'string' && product.source.trim()) result.source = clipped(product.source, 300)
  const source = safeUrl(product.third_product_url)
  if (source) result.sourceUrl = source
  if (typeof product.price === 'number' && Number.isFinite(product.price) && product.price >= 0) result.price = product.price
  if (typeof product.price_unit === 'string' && product.price_unit.trim()) result.priceUnit = clipped(product.price_unit.trim(), 50)
  if (knownImages || Array.isArray(product.image_urls)) result.imageCount = new Set(originals(product).map(safeUrl).filter(Boolean)).size
  return result
}

function listQuery(value) {
  const checked = validate('list_products', value).input
  const query = { ...(typeof checked.keyword === 'string' && checked.keyword.trim() ? { keyword: checked.keyword.trim() } : {}), page: checked.page ?? 0, size: checked.size ?? 12 }
  ensure(Number.isSafeInteger(query.page) && query.page >= 0 && query.page < Number.MAX_SAFE_INTEGER && Number.isSafeInteger(query.size) && query.size >= 1 && query.size <= 50 && (!query.keyword || query.keyword.length <= 300), 'Product picker accepts page >= 0, size 1..50 and a keyword up to 300 characters')
  return query
}

function prepare(state) {
  const page = state.page
  ensure(page && Array.isArray(page.content), 'Product list is missing content')
  ensure(['total_elements', 'total_pages', 'number', 'size'].every(key => Number.isSafeInteger(page[key]) && page[key] >= 0), 'Product response is missing valid pagination; use the saved complete result for fallback')
  ensure(page.number === state.query.page && page.size === state.query.size && page.content.length <= page.size && page.total_elements >= page.content.length, 'Product pagination differs from this query')
  const items = page.content.map(row => summary(state.detailRecord && exactId(row.id) === exactId(state.detailRecord.id) ? state.detailRecord : row, !!state.detailRecord && exactId(row.id) === exactId(state.detailRecord.id)))
  ensure(new Set(items.map(item => item.id)).size === items.length, 'Duplicate product IDs')
  const input = { schemaVersion: 1, pickerId: state.pickerId, query: state.query, maxImages: state.maxImages,
    total: String(page.total_elements), hasMore: BigInt(page.number + 1) * BigInt(page.size) < BigInt(page.total_elements), items }
  if (state.detailRecord) {
    ensure(items.some(item => item.id === exactId(state.detailRecord.id)), 'Detail product is not in this page')
    const record = state.detailRecord
    const seenUrls = new Set()
    state.images = []
    for (const originalUrl of originals(record)) {
      const url = safeUrl(originalUrl)
      if (url && !seenUrls.has(url)) { seenUrls.add(url); state.images.push({ id: crypto.randomUUID(), originalUrl, url }) }
    }
    ensure(state.images.length <= 40, 'More than 40 product images; use the complete saved detail as text/file fallback')
    const detail = { ...summary(record, true), images: state.images.map(({ id, url }) => ({ id, url })) }
    if (typeof record.description === 'string' && record.description) detail.description = clipped(record.description, 6000)
    if (Array.isArray(record.selling_points)) detail.sellingPoints = record.selling_points.filter(value => typeof value === 'string' && value.trim()).slice(0, 30).map(value => clipped(value, 1000))
    input.detail = detail
  }
  ensure(input.items.length <= 50 && Buffer.byteLength(JSON.stringify(input)) <= 512 * 1024, 'Product picker limit exceeded; use the complete local result as text/file fallback')
  return input
}

async function outsideSkill(file) {
  ensure(file && path.isAbsolute(file), 'Use an absolute snapshot path outside the installed Skill')
  const parent = await fs.realpath(path.dirname(file)), root = await fs.realpath(path.resolve(__dirname, '..'))
  const relative = path.relative(root, parent)
  ensure(relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative), 'Keep snapshots outside the installed Skill')
}
async function readPrivate(file) {
  const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    ensure(stat.isFile() && stat.size <= 10 * 1024 * 1024, 'Invalid product picker snapshot')
    if (process.platform !== 'win32') ensure(stat.uid === process.getuid() && !(stat.mode & 0o077), 'Product snapshot must be private')
    return parseJson(await handle.readFile('utf8'))
  } finally { await handle.close() }
}
async function save(file, value, exclusive = false) {
  const handle = await fs.open(file, exclusive ? 'wx' : constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
  try {
    const stat = await handle.stat()
    if (process.platform !== 'win32') ensure(stat.uid === process.getuid() && !(stat.mode & 0o077), 'Product snapshot must be private')
    ensure(stat.isFile(), 'Product snapshot must be a regular file')
    await handle.truncate(0); await handle.writeFile(JSON.stringify(value) + '\n'); await handle.sync()
  } finally { await handle.close() }
}

async function main(argv, { query = runCli, env = process.env } = {}) {
  const [command, ...tokens] = argv
  if (['help', '--help'].includes(command)) return { tool: 'vibbit_show_product_picker', usage: [
    'query --state NEW_SNAPSHOT [--input LIST_FILTERS_JSON] [--max-images 1..40] [--region cn|global]',
    'inspect|browse --state CURRENT_SNAPSHOT --event EVENT_JSON --new-state NEW_SNAPSHOT [--region cn|global]',
    'resolve --state CURRENT_SNAPSHOT --event SELECTION_JSON [--region cn|global]',
    'resume --state PENDING_PRODUCT_PICKER_STATE [--region cn|global]',
  ], api_key_argument: false }
  ensure(['query', 'inspect', 'browse', 'resolve', 'resume'].includes(command), 'Use query, inspect, browse, resolve or resume')
  const flags = {}
  for (let i = 0; i < tokens.length; i += 2) {
    const key = tokens[i].replace(/^--/, '')
    ensure(tokens[i].startsWith('--') && ['state', 'input', 'max-images', 'region', 'event', 'new-state'].includes(key) && !Object.hasOwn(flags, key) && tokens[i + 1] && !tokens[i + 1].startsWith('--'), 'Invalid or duplicate option')
    flags[key] = tokens[i + 1]
  }
  const allowed = command === 'query' ? ['state', 'input', 'max-images', 'region'] : command === 'resume' ? ['state', 'region'] : command === 'resolve' ? ['state', 'event', 'region'] : ['state', 'event', 'new-state', 'region']
  ensure(Object.keys(flags).every(key => allowed.includes(key)), 'Option does not apply to this command')
  await outsideSkill(flags.state)
  const account = await resolveAccount({ env, region: flags.region }), credential = await resolveCredential({ env, account })
  ensure(credential.key, 'Configure the selected business account before browsing products')
  const checkBinding = state => ensure(state.version === 1 && state.base === account.base && state.credentialBinding === hmac(credential.key, state.pickerId), 'Account or environment changed; query a new product list')
  const outputFor = (state, file) => ({ ok: true, state_file: file, tool: 'vibbit_show_product_picker', arguments: state.input })
  let state, file = flags.state, resume = command === 'resume'
  if (command === 'query') {
    const input = flags.input ? parseJson(await fs.readFile(flags.input, 'utf8')) : {}
    const maxImages = flags['max-images'] ? Number(flags['max-images']) : 8
    ensure(Number.isInteger(maxImages) && maxImages >= 1 && maxImages <= 40, 'max-images must be 1..40')
    state = { operation: 'list', query: listQuery(input), maxImages }
  } else {
    const current = await readPrivate(flags.state); checkBinding(current)
    if (resume) {
      state = current
      if (state.phase === 'ready') return outputFor(state, file)
      if (state.phase === 'done') return state.resolved
      ensure(['querying', 'pending', 'uncertain', 'preparing'].includes(state.phase), 'This product operation cannot be resumed')
    } else {
      ensure(current.phase === 'ready', 'Resume the original pending query before using its picker')
      ensure(flags.event && path.isAbsolute(flags.event), 'Use an absolute event JSON file')
      const event = parseJson(await fs.readFile(flags.event, 'utf8'))
      ensure(event?.schemaVersion === 1 && event.pickerId === current.pickerId, 'Event belongs to a different product list')
      if (command === 'browse') {
        ensure(event.type === 'product.browse' && Object.keys(event).every(key => ['schemaVersion', 'type', 'pickerId', 'query'].includes(key)), 'Invalid product browse event')
        state = { operation: 'list', query: listQuery(event.query), maxImages: current.maxImages }
      } else {
        ensure(typeof event.id === 'string' && current.input.items.some(item => item.id === event.id), 'Product is not in the current page')
        if (command === 'inspect') {
          ensure(event.type === 'product.inspect' && Object.keys(event).every(key => ['schemaVersion', 'type', 'pickerId', 'id'].includes(key)), 'Invalid product detail event')
          state = { operation: 'detail', requestedId: event.id, query: current.query, maxImages: current.maxImages, page: current.page }
        } else {
          ensure(event.type === 'product.selected' && Object.keys(event).every(key => ['schemaVersion', 'type', 'pickerId', 'id', 'imageIds'].includes(key)), 'Invalid product selection event')
          const images = current.detailRecord && exactId(current.detailRecord.id) === event.id ? current.images : []
          ensure(Array.isArray(event.imageIds) && event.imageIds.length <= current.maxImages && new Set(event.imageIds).size === event.imageIds.length && event.imageIds.every(id => images.some(image => image.id === id)), 'Reference images do not belong to this product or exceed the selection limit')
          state = { operation: 'resolve', requestedId: event.id, sourcePickerId: current.pickerId, selection: event, images, query: current.query, maxImages: current.maxImages }
        }
      }
      file = command === 'resolve' ? path.join(path.dirname(flags.state), path.basename(flags.state) + '.resolve-' + crypto.randomUUID() + '.json') : flags['new-state']
      await outsideSkill(file)
    }
  }
  if (!resume) {
    state = { ...state, version: 1, createdAt: new Date().toISOString(), base: account.base, pickerId: crypto.randomUUID(), phase: 'querying' }
    state.credentialBinding = hmac(credential.key, state.pickerId)
    state.cliState = file + '.request.json'
    await save(file, state, true)
  }
  let result = state.phase === 'preparing' ? state.output : undefined
  if (!result) {
    const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'vibbit-product-read-'))
    try {
      let args
      if (resume) args = ['resume', '--state', state.cliState, '--timeout-seconds', '50']
      else {
        const inputFile = path.join(temporary, 'input.json')
        await fs.writeFile(inputFile, JSON.stringify(state.operation === 'list' ? state.query : { product_id: state.requestedId }), { mode: 0o600, flag: 'wx' })
        args = [state.operation === 'list' ? 'list_products' : 'get_product', '--input', inputFile, '--state', state.cliState, '--wait', '--timeout-seconds', '50']
      }
      result = await query([...args, ...(flags.region ? ['--region', flags.region] : [])])
    } catch (error) {
      state.phase = 'uncertain'; await save(file, state); error.productPickerState = file; throw error
    } finally { await fs.rm(temporary, { recursive: true, force: true }) }
    ensure(!result?.account_base || result.account_base === account.base, 'Product query account differs from this snapshot')
    state.output = result
    if (result?.ok !== true || ['FAILED', 'INSUFFICIENT_POINTS'].includes(result.status)) {
      state.phase = 'failed'; await save(file, state)
      return { ...result, ok: false, product_picker_state: file }
    }
    if (result.status !== 'COMPLETED') {
      state.phase = 'pending'; await save(file, state)
      return { ...result, product_picker_state: file, next: 'Resume this product picker state; never resubmit the original query' }
    }
    state.phase = 'preparing'; await save(file, state)
  }
  try {
    if (state.operation === 'resolve') {
      ensure(exactId(result.result?.id) === state.requestedId, 'Fresh product detail ID differs from the selected ID')
      const allowedUrls = new Set(originals(result.result))
      const images = state.selection.imageIds.map(id => state.images.find(image => image.id === id))
      ensure(images.every(image => image && allowedUrls.has(image.originalUrl)), 'Product images changed; refresh the detail and choose reference images again')
      state.resolved = { ok: true, pickerId: state.sourcePickerId, product_id: state.requestedId, record: result.result,
        reference_images: images.map(image => ({ image_id: image.id, url: image.originalUrl })) }
      state.phase = 'done'; await save(file, state)
      return state.resolved
    }
    if (state.operation === 'list') state.page = result.result
    else { ensure(exactId(result.result?.id) === state.requestedId, 'Returned product detail ID differs from the selected ID'); state.detailRecord = result.result }
    state.input = prepare(state); state.phase = 'ready'; await save(file, state)
    return outputFor(state, file)
  } catch (error) { error.productPickerState = file; throw error }
}

if (require.main === module) main(process.argv.slice(2)).then(
  result => process.stdout.write(JSON.stringify(result, null, 2) + '\n'),
  error => { process.stdout.write(JSON.stringify({ ok: false, error: { kind: error.kind || 'configuration', message: error.message }, ...(error.productPickerState ? { product_picker_state: error.productPickerState } : {}) }) + '\n'); process.exitCode = 2 },
)
module.exports = { main, prepare, summary, safeUrl, exactId, listQuery }
