#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const { parseJson } = require('./lib/json')
const { publicUrl } = require('./lib/media')
const { long } = require('./lib/translation')
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = value => typeof value === 'string' && value.trim().length > 0
const finite = value => typeof value === 'number' && Number.isFinite(value)
const epsilon = 0.001

// This is a local editorial plan, never an OpenAPI payload or a semantic scorer.
function checkPlan(plan) {
  const issues = []
  const check = (condition, code, id) => { if (!condition) issues.push({ code, ...(id ? { id } : {}) }) }
  if (!object(plan)) throw new Error('Expected a semantic mixcut plan object')
  check(plan.version === 1 && plan.kind === 'semantic_mixcut', 'unsupported-plan')
  check(plan.render_target === 'vibbit_cloud' && plan.matching_executor === 'agent', 'execution-location')
  check(['cn', 'global'].includes(plan.account_site), 'account-site')
  check(finite(plan.duration_seconds) && plan.duration_seconds > 0, 'duration')
  if (plan.template_ref !== undefined) check(object(plan.template_ref) && text(plan.template_ref.id)
    && Number.isSafeInteger(plan.template_ref.revision) && plan.template_ref.revision > 0, 'template-revision')
  const array = (value, label, nonempty = false) => {
    if (!Array.isArray(value)) { issues.push({ code: label + '-array' }); return [] }
    check(!nonempty || value.length > 0, label + '-empty')
    return value.filter((item, index) => {
      if (object(item)) return true
      issues.push({ code: label + '-object', id: String(index) }); return false
    })
  }
  const unique = (items, label) => {
    const map = new Map()
    for (const item of items) {
      check(text(item.id) && !map.has(item.id), label + '-id', item.id)
      map.set(item.id, item)
    }
    return map
  }
  const assets = unique(array(plan.assets, 'assets', true), 'asset')
  const audio = array(plan.audio_clips, 'audio')
  const voices = unique(audio, 'audio')
  const visuals = array(plan.visual_clips, 'visual', true)
  const shots = unique(visuals, 'visual')
  const captions = array(plan.captions, 'captions')
  unique(captions, 'caption')
  const scope = plan.material_scope?.material_ids
  check(Array.isArray(scope), 'material-scope')
  const allowed = new Set(Array.isArray(scope) ? scope.map(String) : [])
  for (const id of Array.isArray(scope) ? scope : []) { try { long(id, 'material_id') } catch { check(false, 'scope-material-id', String(id)) } }
  for (const asset of assets.values()) {
    check(['VIDEO', 'IMAGE', 'AUDIO'].includes(asset.media_type), 'asset-media-type', asset.id)
    check(['material', 'generated', 'upload'].includes(asset.origin), 'asset-origin', asset.id)
    try { publicUrl(asset.url, 'asset.url') } catch { check(false, 'asset-url', asset.id) }
    if (asset.media_type !== 'IMAGE') check(finite(asset.duration_seconds) && asset.duration_seconds > 0, 'asset-duration', asset.id)
    if (asset.material_id !== undefined) {
      try { long(asset.material_id, 'material_id') } catch { check(false, 'asset-material-id', asset.id) }
    }
    if (asset.origin === 'material') check(asset.material_id !== undefined && allowed.has(String(asset.material_id)), 'outside-material-scope', asset.id)
  }
  const range = (clip, source = true) => {
    check(clip.playback_rate === undefined || clip.playback_rate === 1, 'unsupported-playback-rate', clip.id)
    check(finite(clip.start) && finite(clip.end) && clip.start >= 0 && clip.end > clip.start
      && clip.end <= plan.duration_seconds + epsilon, 'timeline-range', clip.id)
    const asset = assets.get(clip.asset_id)
    check(!!asset, 'missing-asset', clip.id)
    if (source && asset) {
      check(finite(clip.source_in) && finite(clip.source_out) && clip.source_in >= 0 && clip.source_out > clip.source_in
        && clip.source_out <= asset.duration_seconds + epsilon, 'source-range', clip.id)
      check(Math.abs((clip.source_out - clip.source_in) - (clip.end - clip.start)) <= epsilon, 'duration-mismatch', clip.id)
    }
    return asset
  }
  for (const clip of audio) {
    const asset = range(clip)
    check(['AUDIO', 'VIDEO'].includes(asset?.media_type), 'audio-media-type', clip.id)
    check(['speech', 'ambience', 'music'].includes(clip.role), 'audio-role', clip.id)
    check(['original', 'narration', 'provided'].includes(clip.source_kind), 'audio-source-kind', clip.id)
    check(finite(clip.gain) && clip.gain >= 0, 'audio-gain', clip.id)
    if (clip.role === 'speech') check(clip.gain > 0, 'silent-speech', clip.id)
  }
  for (const clip of visuals) {
    const asset = range(clip, clip.kind !== 'image')
    check(['material', 'avatar', 'image'].includes(clip.kind), 'visual-kind', clip.id)
    check(asset?.media_type === (clip.kind === 'image' ? 'IMAGE' : 'VIDEO'), 'visual-media-type', clip.id)
    // All audible source tracks are represented explicitly in audio_clips.
    check(clip.embedded_audio === 'mute', 'duplicate-embedded-audio', clip.id)
    if (clip.kind === 'image') check(clip.source_in === undefined && clip.source_out === undefined, 'image-source-range', clip.id)
    if (clip.kind === 'avatar') {
      const speech = voices.get(clip.speech_audio_id)
      const driver = asset?.driven_by
      check(speech?.role === 'speech' && clip.start >= speech.start - epsilon && clip.end <= speech.end + epsilon, 'avatar-speech-coverage', clip.id)
      check(object(driver) && driver.asset_id === speech?.asset_id && finite(driver.offset_seconds) && driver.offset_seconds >= 0, 'avatar-driver', clip.id)
      check(assets.get(driver?.asset_id)?.media_type === 'AUDIO', 'avatar-driver-media-type', clip.id)
      check(Math.abs((driver?.offset_seconds + clip.source_in) - (speech?.source_in + clip.start - speech?.start)) <= epsilon, 'avatar-sync', clip.id)
    }
    check(text(clip.purpose) && text(clip.selection_reason) && text(clip.evidence), 'selection-evidence', clip.id)
  }
  const orderedVisuals = [...visuals].sort((a, b) => a.start - b.start)
  let cursor = 0
  for (const clip of orderedVisuals) {
    check(finite(clip.start) && Math.abs(clip.start - cursor) <= epsilon, 'visual-gap-or-overlap', clip.id)
    cursor = clip.end
  }
  check(Math.abs(cursor - plan.duration_seconds) <= epsilon, 'visual-end')
  const speech = audio.filter(clip => clip.role === 'speech').sort((a, b) => a.start - b.start)
  let speechEnd = 0
  for (const clip of speech) {
    check(clip.start >= speechEnd - epsilon, 'overlapping-speech', clip.id)
    speechEnd = Math.max(speechEnd, clip.end)
  }
  for (const caption of captions) {
    const clip = voices.get(caption.audio_clip_id)
    check(clip?.role === 'speech' && text(caption.text) && finite(caption.start) && finite(caption.end)
      && caption.start >= clip.start - epsilon && caption.end <= clip.end + epsilon && caption.end > caption.start, 'caption-speech-range', caption.id)
  }
  if (issues.length) { const error = new Error('Invalid semantic mixcut plan'); error.issues = issues; throw error }
  return { ok: true, plan_valid: true, render_target: 'vibbit_cloud', matching_executor: 'agent', submitted: false,
    cloud_request_verified: false, media_checked: false, semantic_quality_checked: false,
    duration_seconds: plan.duration_seconds, visuals: shots.size, audio_clips: voices.size,
    required_cloud_features: ['source_trim', 'video_placement', 'embedded_audio_mute',
      ...(audio.length ? ['audio_placement', 'audio_gain'] : []),
      ...(audio.some(clip => assets.get(clip.asset_id).media_type === 'VIDEO') ? ['source_video_audio'] : []),
      ...(captions.length ? ['timed_captions'] : [])] }
}

function main(argv) {
  if (!argv.length || ['help', '--help'].includes(argv[0])) return {
    usage: 'node scripts/mixcut.js check --input PLAN.json | compile --input PLAN.json --template PACKING_TEMPLATE.json',
    behavior: 'Offline timing and audio-routing validation and compose request compilation. No API calls, semantic matching, rendering or file writes.',
  }
  if (argv[0] === 'check' && argv.length === 3 && argv[1] === '--input') return checkPlan(readJson(argv[2]))
  if (argv[0] === 'compile' && argv.length === 5 && argv[1] === '--input' && argv[3] === '--template') {
    return compilePlan(readJson(argv[2]), readJson(argv[4]))
  }
  throw new Error('Use check --input PLAN.json or compile --input PLAN.json --template PACKING_TEMPLATE.json')
}

function readJson(file) {
  const stat = fs.statSync(file)
  if (!stat.isFile() || stat.size > 1024 * 1024) throw new Error('Input must be a regular JSON file of at most 1 MB')
  return parseJson(fs.readFileSync(file, 'utf8'))
}

function compilePlan(plan, template) {
  checkPlan(plan)
  if (!object(template) || ![template.background?.width, template.background?.height].every(n => Number.isSafeInteger(n) && n > 0)) {
    throw new Error('Use a resolved video_packing_template with an explicit positive integer canvas width and height')
  }
  if (Object.hasOwn(template.audio ?? {}, 'original_volume') || template.audio?.bgm_list?.length) {
    throw new Error('Use a template without original_volume or BGM, and express all sound in audio_clips')
  }
  if (template.cover?.enabled || template.end_frame?.enabled) {
    throw new Error('Represent cover and end-frame timing as visual clips')
  }
  const packaging = structuredClone(template)
  const subtitleStyles = Array.isArray(packaging.subtitle_track_clips)
    ? packaging.subtitle_track_clips.filter(style => style?.enabled === true && style.type === 'subtitle') : []
  if (plan.captions.length) {
    if (subtitleStyles.length !== 1 || subtitleStyles[0].scroll_mode) {
      throw new Error('Timed captions require one enabled ordinary subtitle style without scrolling')
    }
    subtitleStyles[0].enable_keywords ??= false
  }
  const assets = new Map(plan.assets.map(asset => [asset.id, asset]))
  const ordered = clips => [...clips].sort((a, b) => a.start - b.start)
  const timeline = clip => ({ TimelineIn: clip.start, TimelineOut: clip.end })
  const trim = clip => ({ In: clip.source_in, Out: clip.source_out })
  const volume = gain => ({ Effects: [{ Type: 'Volume', Gain: gain }] })
  const media = clip => ({ MediaURL: assets.get(clip.asset_id).url, ...timeline(clip) })
  const packing = {
    video_track_list: [{ MainTrack: true, VideoTrackClips: ordered(plan.visual_clips).map(clip => ({
      ...media(clip),
      ...(clip.kind === 'image'
        ? { Type: 'Image', Duration: clip.end - clip.start }
        : { Type: 'Video', ...trim(clip), ...volume(0) }),
    })) }],
  }
  if (plan.audio_clips.length) packing.audio_track_list = ordered(plan.audio_clips).map(clip => ({
    AudioTrackClips: [{ ...media(clip), ...trim(clip), ...volume(clip.gain) }],
  }))
  if (plan.captions.length) packing.subtitle_tracks = [{
    SubtitleTrackClips: ordered(plan.captions).map(clip => ({ Content: clip.text, ...timeline(clip) })),
  }]
  return { packing_origin: packing, video_packing_template: packaging }
}

if (require.main === module) {
  try { process.stdout.write(JSON.stringify(main(process.argv.slice(2)), null, 2) + '\n') }
  catch (error) { process.stderr.write(JSON.stringify({ ok: false, error: error.message, issues: error.issues }) + '\n'); process.exitCode = 2 }
}
module.exports = { main, checkPlan, compilePlan }
