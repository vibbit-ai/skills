'use strict'

const { VibbitError } = require('./client')
const { publicUrl } = require('./media')
const { long } = require('./translation')

const states = { DRAFT: 'PENDING', ANALYZING: 'RUNNING', ANALYZED: 'COMPLETED', PUBLISHED: 'COMPLETED', FAILED: 'FAILED' }
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const source = { trust: 'untrusted', instruction_authority: 'none', scope: 'viral_structure_results' }

function validateViralStructure(name, input) {
  if (name === 'list_viral_structures') {
    if (input.page_no !== undefined && input.page_no < 1) throw new Error('page_no starts at 1')
    if (input.page_size !== undefined && (input.page_size < 1 || input.page_size > 50)) throw new Error('page_size must be 1..50')
    return
  }
  for (const key of ['video_url', 'cover_url']) {
    if (input[key] === undefined) continue
    if (/\s/.test(input[key])) throw new Error(`${key} must not contain whitespace`)
    publicUrl(input[key], key, 4096)
  }
  if (input.request_idempotency_key?.length > 128) throw new Error('request_idempotency_key must be at most 128 characters')
}

function viralListPath(input) {
  const query = new URLSearchParams(Object.entries(input)).toString()
  return '/viral-structures' + (query ? '?' + query : '')
}

function normalizeViralList(data, input) {
  const pageNo = input.page_no ?? 1
  const pageSize = input.page_size ?? 20
  if (!object(data) || !Array.isArray(data.items) || !data.items.every(object)
    || (data.page_no ?? data.page) !== pageNo || data.page_size !== pageSize || data.items.length > pageSize) {
    throw new VibbitError('protocol', 'Invalid viral structure page')
  }
  try { long(data.total, 'total', 0n) } catch { throw new VibbitError('protocol', 'Invalid viral structure total') }
  return { ok: true, status: 'COMPLETED', delivery_kind: 'viral_structure_list', artifacts: [], source_content: source,
    result: { ...data, total: String(data.total), page_no: pageNo,
      has_more: BigInt(data.total) > BigInt(pageNo) * BigInt(pageSize) } }
}

function normalizeViralStructure(data) {
  try { long(data?.id, 'structure ID') } catch { throw new VibbitError('protocol', 'Viral structure response is missing a valid ID') }
  if (!Object.hasOwn(states, data.status)) throw new VibbitError('protocol', 'Unknown viral structure status')
  const id = String(data.id)
  return { ok: data.status !== 'FAILED', status: states[data.status], structure_id: id, structure_status: data.status,
    delivery_kind: 'viral_structure', artifacts: [], source_content: source, result: { ...data, id } }
}

async function findViralStructure(client, id, budgetMs) {
  long(id, 'structure ID')
  const deadline = Date.now() + (budgetMs ?? 30000)
  for (let page_no = 1; page_no <= 20; page_no++) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) throw new VibbitError('transport', 'Viral structure lookup timed out', { structure_id: id })
    const input = { page_no, page_size: 50 }
    const page = normalizeViralList(await client.request('GET', viralListPath(input), undefined, remaining), input)
    const row = page.result.items.find(item => item.id !== undefined && String(item.id) === id)
    if (row) return normalizeViralStructure(row)
    if (!page.result.has_more) break
  }
  throw new VibbitError('not_found', 'Structure was not found in the pages searched. Check its original workspace or list further pages.', { structure_id: id })
}

module.exports = { validateViralStructure, viralListPath, normalizeViralList, normalizeViralStructure, findViralStructure }
