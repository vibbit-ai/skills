'use strict'

const { createHash } = require('node:crypto')
const { readFile } = require('node:fs/promises')

const failedTask = new Set(['FAILED', 'INSUFFICIENT_POINTS', 'CANCELLED'])
const idPattern = /^[A-Za-z0-9_-]{1,90}$/
const id = value => typeof value === 'string' && idPattern.test(value)
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value, length = 180) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, length) : ''
const objectWithKeys = (value, allowed) =>
  record(value) && Object.keys(value).every(key => allowed.includes(key))
const oneOf = (value, allowed) => allowed.includes(value)
function safeUrl(value) {
  if (typeof value !== 'string' || value.length > 4096 || /[\x00-\x20\\]/.test(value)) return
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && !url.username && !url.password
      && url.hostname !== 'willing-video-test.oss-cn-shanghai.aliyuncs.com') return url
  } catch {
    // Do not surface an invalid URL as a candidate.
  }
}

function sourceRows(result, level = 0) {
  if (level > 5) throw new Error('Unexpected nested search receipt')
  if (typeof result === 'string') result = JSON.parse(result)
  if (record(result)) {
    if (result.ok === false || result.isError || failedTask.has(result.status)
      || (result.status && result.status !== 'COMPLETED')
      || (result.code !== undefined && result.code !== 200)) {
      throw new Error('Search receipt did not complete')
    }
    if (record(result.data)) return sourceRows(result.data, level + 1)
    if (record(result.task_result)) return sourceRows(result.task_result.result, level + 1)
    if ('result' in result) return sourceRows(result.result, level + 1)
  }
  if (!Array.isArray(result)) throw new Error('Expected a TikTok result array')
  return result
}
const metricNames = {
  play_count: 'plays', digg_count: 'likes', comment_count: 'comments',
  share_count: 'shares', collect_count: 'saves',
}
function tiktokItem(raw) {
  const link = safeUrl(raw?.link)
  if (!link || !/(^|\.)tiktok\.com$/.test(link.hostname)) return
  const linkedId = link.pathname.match(/\/video\/([0-9]{8,30})(?:\/|$)/)?.[1]
  const reportedId = typeof raw.video_id === 'string' && /^[0-9]{8,30}$/.test(raw.video_id) ? raw.video_id : undefined
  if (reportedId && linkedId && reportedId !== linkedId) return
  const title = text(raw.title)
  if (!title) return
  const videoId = reportedId || linkedId ||
    createHash('sha256').update(link.hostname + link.pathname).digest('hex').slice(0, 24)
  const author = text(raw.author_name) || text(raw.author_id)
  const thumbnail = safeUrl(raw.thumbnail)
  const metrics = {}
  for (const [field, key] of Object.entries(metricNames)) {
    const value = raw.statistics?.[field]
    const number = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN
    if (Number.isSafeInteger(number) && number >= 0) metrics[key] = number
  }
  return {
    id: 'tiktok-' + videoId, source: 'tiktok', title, url: raw.link,
    ...(author ? { author } : {}), ...(thumbnail ? { thumbnailUrl: raw.thumbnail } : {}),
    match: 'unverified', ...(Object.keys(metrics).length ? { metrics } : {}),
  }
}

function combineReferences(input) {
  const { results, limit = 24 } = input ?? {}
  if (!Array.isArray(results) || results.length > 24 || !Number.isInteger(limit) || limit < 1 || limit > 40) {
    throw new Error('Supply up to 24 TikTok receipts and a limit between 1 and 40')
  }
  const items = new Map()
  const unavailable = []
  for (const [index, result] of results.entries()) {
    let rows
    try {
      rows = sourceRows(result)
    } catch {
      unavailable.push(index)
      continue
    }
    for (const raw of rows) {
      const item = tiktokItem(raw)
      if (!item) continue
      const first = items.get(item.id)
      if (!first) {
        items.set(item.id, item)
      } else {
        // One post counts once. Keep the first observation and fill only missing metrics.
        if (!first.thumbnailUrl && item.thumbnailUrl) first.thumbnailUrl = item.thumbnailUrl
        if (!first.author && item.author) first.author = item.author
        if (item.metrics) first.metrics = { ...item.metrics, ...first.metrics }
      }
    }
  }
  const ranked = [...items.values()].sort((a, b) => (b.metrics?.plays ?? -1) - (a.metrics?.plays ?? -1))
  return { items: ranked.slice(0, limit), uniqueCount: ranked.length, unavailable }
}

const briefKeys = ['format', 'placement', 'ratio', 'market', 'language', 'seconds', 'imageCount', 'narration', 'music', 'variantId', 'angle']
const sized = (value, length) => typeof value === 'string' && value.trim().length <= length
const integer = (value, minimum, maximum) => Number.isInteger(value) && value >= minimum && value <= maximum
function checkBrief(brief, card) {
  return objectWithKeys(brief, briefKeys)
    && oneOf(brief.format, ['video', 'images', 'both'])
    && oneOf(brief.placement, ['reels', 'feed', 'tiktok', 'youtube', 'other'])
    && oneOf(brief.ratio, ['9:16', '4:5', '1:1', '16:9', '3:4', '4:3', '21:9'])
    && sized(brief.market, 60) && sized(brief.language, 60) && sized(brief.angle, 240)
    && integer(brief.seconds, 4, 30) && integer(brief.imageCount, 1, 12)
    && oneOf(brief.narration, ['none', 'voiceover', 'avatar'])
    && oneOf(brief.music, ['none', 'reuse', 'generate'])
    && (brief.variantId === undefined || (id(brief.variantId)
      && (brief.variantId === card.brief?.variantId || card.variants?.some(row => row.id === brief.variantId))))
}
const revisions = {
  image: ['edit-image'],
  keyframe: ['edit-image'],
  music: ['replace-music'],
  voice: ['revise-voice'],
  shot: ['edit-shot'],
  video: ['change-opening', 'adapt-placement'],
}
const actionFields = {
  'ad.settings.selected': ['brief'],
  'ad.product.save': ['draftBrief'],
  'ad.references.search': ['query', 'source', 'selectedIds'],
  'ad.references.add': ['url', 'selectedIds'],
  'ad.references.selected': ['ids'],
  'ad.concept.selected': ['id'],
  'ad.back': ['target', 'selectedIds'],
  'ad.preview.revise': ['id', 'action'],
}

function resolveStudioEvent(card, event) {
  const identity = ['schemaVersion', 'studioId', 'cardId', 'revision']
  const fields = typeof event?.type === 'string' && Object.hasOwn(actionFields, event.type) && actionFields[event.type]
  if (!record(card) || card.schemaVersion !== 1 || !id(card.studioId)
    || typeof card.cardId !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(card.cardId)
    || !integer(card.revision, 1, Number.MAX_SAFE_INTEGER)
    || !fields || !objectWithKeys(event, [...identity, 'type', ...fields])
    || identity.some(key => event[key] !== card[key])) {
    throw new Error('Use the event and snapshot from the current card')
  }
  const currentItems = Array.isArray(card.items) ? card.items : []
  const allowedIds = values => card.kind === 'references' && Array.isArray(values) && values.length <= 8
    && new Set(values).size === values.length && values.every(value => id(value) && currentItems.some(item => item.id === value))
  const selectedRecords = values => values.map(value => currentItems.find(item => item.id === value))
  switch (event.type) {
    case 'ad.settings.selected':
      if (card.kind === 'settings' && checkBrief(event.brief, card)) return { event }
      break
    case 'ad.product.save':
      if (!card.product?.saved && safeUrl(card.product?.sourceUrl)
        && (event.draftBrief === undefined || (card.kind === 'settings' && checkBrief(event.draftBrief, card)))) {
        return { event, sourceUrl: card.product.sourceUrl }
      }
      break
    case 'ad.references.search':
      if (allowedIds(event.selectedIds) && oneOf(event.source, ['all', 'tiktok', 'meta', 'google'])
        && sized(event.query, 180) && event.query.trim()) return { event }
      break
    case 'ad.references.add':
      if (allowedIds(event.selectedIds) && safeUrl(event.url)) return { event }
      break
    case 'ad.references.selected':
      if (allowedIds(event.ids)) return { event, selection: selectedRecords(event.ids) }
      break
    case 'ad.concept.selected': {
      const choice = card.kind === 'concepts' && id(event.id) && currentItems.find(item => item.id === event.id)
      if (choice) return { event, selection: choice }
      break
    }
    case 'ad.back':
      if ((card.kind === 'references' && event.target === 'settings' && allowedIds(event.selectedIds ?? []))
        || (card.kind === 'concepts' && oneOf(event.target, ['settings', 'references']) && event.selectedIds === undefined)) return { event }
      break
    case 'ad.preview.revise': {
      const asset = card.kind === 'preview' && id(event.id) && card.assets?.find(item => item.id === event.id)
      if (asset && oneOf(asset.status, ['ready', 'failed'])) {
        const choices = asset.role === 'video' && asset.status === 'failed' ? ['edit-shot'] : revisions[asset.role]
        if (choices?.includes(event.action)) return { event, selection: asset }
      }
      break
    }
  }
  throw new Error('The action is not valid for this snapshot')
}

const usage = 'ad-studio.js references --input file.json | resolve --card card.json --event event.json'
async function main(args) {
  if (!args.length || args[0] === '--help') return { usage }
  const json = async path => JSON.parse(await readFile(path, 'utf8'))
  if (args[0] === 'references' && args.length === 3 && args[1] === '--input') {
    return combineReferences(await json(args[2]))
  }
  if (args[0] === 'resolve' && args.length === 5 && args[1] === '--card' && args[3] === '--event') {
    return resolveStudioEvent(await json(args[2]), await json(args[4]))
  }
  throw new Error(usage)
}

if (require.main === module) main(process.argv.slice(2))
  .then(value => process.stdout.write(JSON.stringify(value) + '\n'))
  .catch(() => {
    process.stderr.write('Invalid ad studio input. ' + usage + '\n')
    process.exitCode = 2
  })

module.exports = { combineReferences, resolveStudioEvent }
