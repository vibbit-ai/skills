'use strict'

const fs = require('node:fs/promises')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')
const net = require('node:net')

function publicUrl(value, label = 'URL', maxLength = 2048) {
  if (typeof value !== 'string' || value.length > maxLength) throw new Error(`${label}: expected HTTP(S) URL of at most ${maxLength} characters`)
  let url
  try { url = new URL(value) } catch { throw new Error(`${label}: invalid URL`) }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  const v4 = net.isIP(host) === 4 ? host.split('.').map(Number) : null
  const privateV4 = v4 && (v4[0] === 0 || v4[0] === 10 || v4[0] === 127 || v4[0] >= 224 ||
    (v4[0] === 169 && v4[1] === 254) || (v4[0] === 172 && v4[1] >= 16 && v4[1] <= 31) ||
    (v4[0] === 192 && v4[1] === 168) || (v4[0] === 100 && v4[1] >= 64 && v4[1] <= 127))
  const privateV6 = net.isIP(host) === 6 && (host === '::' || host === '::1' || /^f[cd]/.test(host) || /^fe[89ab]/.test(host) || /^ff/.test(host) || host.startsWith('::ffff:'))
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
      host.endsWith('.internal') || privateV4 || privateV6) {
    throw new Error(`${label}: requires a publicly accessible HTTP(S) URL without embedded credentials`)
  }
  return value
}

// Local inspection only. Never downloads a remote file or sends it to an extra metadata service.
function checkSeedanceImage(info) {
  const stream = info.streams?.find(item => item.codec_type === 'video')
  const width = stream?.width, height = stream?.height
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error('Image dimensions could not be measured; do not submit an unverified reference image')
  }
  const issues = []
  if (width < 300 || height < 300 || width > 6000 || height > 6000) issues.push('each side must be 300..6000 pixels')
  if (width / height < 0.4 || width / height > 2.5) issues.push('aspect ratio must be 0.4..2.5')
  if (info.bytes >= 30 * 1024 * 1024) issues.push('file size must be below 30 MB')
  if (issues.length) throw new Error(`Seedance 2.5 reference image is ${width}x${height}: ${issues.join('; ')}. Prefer a high-resolution original. For a small thumbnail, create a separate proportionally resized copy (for example, an 800-pixel short edge), recheck it, then upload and use its returned object_url. Upscaling does not restore missing product detail. Do not overwrite the original or guess a larger image URL.`)
  return { profile: 'seedance-2.5-image', dimensions_checked: true, width, height,
    bytes: info.bytes, aspect_ratio: width / height,
    remaining_checks: ['Actual image format and readability', 'Visual product identity and detail', 'Remote URL reachability and expiry'] }
}

async function probeLocal(file, { profile } = {}) {
  if (profile !== undefined && profile !== 'seedance-2.5-image') throw new Error('Supported probe profile: seedance-2.5-image')
  const path = require('node:path').resolve(file)
  const stat = await fs.stat(path)
  if (!stat.isFile()) throw new Error('probe requires a local regular file')
  let stdout
  try {
    ;({ stdout } = await promisify(execFile)('ffprobe', [
      '-v', 'error', '-show_format', '-show_streams', '-of', 'json', path,
    ], { timeout: 15000, maxBuffer: 2 * 1024 * 1024 }))
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('ffprobe is not installed; media metadata remains unverified')
    throw new Error('ffprobe could not inspect the local file; media metadata remains unverified')
  }
  const info = JSON.parse(stdout)
  const output = { file: path, bytes: stat.size, verified: true, format: info.format, streams: info.streams }
  if (profile) output.reference_validation = checkSeedanceImage(output)
  return output
}

module.exports = { publicUrl, probeLocal, checkSeedanceImage }
