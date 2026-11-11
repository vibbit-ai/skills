'use strict'

const crypto = require('node:crypto')
const { parseJson } = require('./json')

function verifyWebhook(raw, signature, key, { now = Date.now(), toleranceMs = 300000 } = {}) {
  if (!Buffer.isBuffer(raw) || raw.length > 8 * 1024 * 1024) throw new Error('Use the original webhook bytes, at most 8 MiB')
  if (typeof key !== 'string' || !key.trim()) throw new Error('Webhook verification requires the submitting API Key')
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/.test(signature)) throw new Error('Invalid webhook signature')
  const expected = crypto.createHmac('sha256', key).update(raw).digest()
  if (!crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'))) throw new Error('Webhook signature mismatch')
  // Verify before decoding: reserializing JSON would change the signed bytes.
  const body = parseJson(raw.toString('utf8'))
  if (!Number.isFinite(now) || !Number.isFinite(toleranceMs) || toleranceMs < 0) throw new Error('Invalid webhook clock configuration')
  const time = typeof body?.timestamp === 'string' && /^\d+$/.test(body.timestamp) ? Number(body.timestamp) : NaN
  if (!Number.isSafeInteger(time) || Math.abs(now - time) > toleranceMs) throw new Error('Webhook signed timestamp is outside the accepted window')
  if (body.event !== 'task.completed' || !/^task-\d+$/.test(body.data?.task_id)
    || !['COMPLETED', 'FAILED', 'INSUFFICIENT_POINTS'].includes(body.data?.status)
    || typeof body.data?.task_info?.task_type !== 'string') throw new Error('Invalid webhook task envelope')
  return { ...body, payload_sha256: crypto.createHash('sha256').update(raw).digest('hex') }
}

module.exports = { verifyWebhook }
