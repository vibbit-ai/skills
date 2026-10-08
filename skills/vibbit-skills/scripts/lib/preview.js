'use strict'

const sourceOrigin = 'https://willing-video-test.oss-cn-shanghai.aliyuncs.com'
const previewOrigin = 'https://media.vibbit.cn'

// Presentation only: preserve original API values and leave query-bearing URLs intact.
function previewUrl(url) {
  if (typeof url !== 'string' || !url.startsWith(sourceOrigin + '/')
    || url.includes('?') || /[\u0000-\u0020\\]/.test(url)) return url
  return previewOrigin + url.slice(sourceOrigin.length)
}

function avatarPreviews(result) {
  if (!Array.isArray(result)) return []
  return result.filter(row => row && typeof row === 'object'
    && typeof row.cover === 'string' && /^https?:\/\//i.test(row.cover))
    .map(row => ({
      ...(row.id !== undefined && row.id !== null ? { resource_id: String(row.id) } : {}),
      ...(typeof row.name === 'string' ? { name: row.name } : {}),
      url: row.cover,
      preview_url: previewUrl(row.cover),
    }))
}

module.exports = { previewUrl, avatarPreviews }
