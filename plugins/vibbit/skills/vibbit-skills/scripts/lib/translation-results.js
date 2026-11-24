'use strict'
const { VibbitError } = require('./client')
const crypto = require('node:crypto')
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const lookup = (value, key) => object(value) && Object.hasOwn(value, key) ? value[key] : undefined
const usable = v => {
  if (typeof v !== 'string') return false
  try { const u = new URL(v); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password } catch { return false }
}

function sourceVideoRecovery(value) {
  const reasons = [value?.message, value?.error_message, value?.result?.error_message,
    ...(Array.isArray(value?.failures) ? value.failures.map(item => item?.reason) : []),
    ...(Array.isArray(value?.result?.items) ? value.result.items.map(item => item?.error_message) : [])]
  if (!reasons.some(reason => typeof reason === 'string' && /\u65e0\u6cd5\u83b7\u53d6\u97f3\u9891\u5206\u79bb\u6e90\u89c6\u9891\u65f6\u957f|(?:cannot|unable to|failed to).*?(?:probe|get|obtain).*?(?:source video duration|duration.*?source video)/i.test(reason))) return undefined
  return {
    reason: 'source_video_duration_unavailable', automatic_retry: false,
    next_steps: [
      'Preserve the original task ID and submission journal. If acceptance or completion is uncertain, query that task before starting another one.',
      'Inspect a local copy of the same source video with probe --file SOURCE_VIDEO and verify a readable video/audio stream and duration.',
      'If the generated/permanent URL failed, upload that source file with upload_info --file SOURCE_VIDEO --input UPLOAD_JSON, where UPLOAD_JSON contains {"is_temporary":true}. Use only the returned object_url; never rewrite a permanent URL hostname or path into a temporary URL.',
      'After confirming the original attempt failed and the new submission is within the authorized scope, replace only the affected source_video.url and retain the language, voice and subtitle settings. Use a new submission ID for the new task and preserve successful results from the old batch.',
    ],
  }
}

const reviewSegmentKeys = ['id', 'from', 'to', 'source_text', 'translated_text', 'confidence', 'speaker_id', 'confirmed', 'lip_sync', 'audio_url', 'audio_duration', 'over_duration', 'audio_group_id']
const warningKeys = ['rendering_warning_code', 'rendering_warning_message']
const reviewItemKeys = ['sub_task_id', 'client_item_id', 'status', 'source_video_url', 'video_url', 'target_languages', 'voice_reference_audio_url',
  'output_video_url', 'no_subtitle_video_url', 'error_message', ...warningKeys]

function pick(source, keys) {
  return Object.fromEntries(keys.filter(key => source?.[key] !== undefined).map(key => [key, source[key]]))
}

function defaultVoice(value) {
  // Missing fields remain missing on older service responses. Never treat a source
  // voice-reference URL as a replacement binding or expose arbitrary server fields.
  if (value === null) return null
  if (value && typeof value === 'object' && !Array.isArray(value) && usable(value.reference_audio_url)) {
    return { reference_audio_url: value.reference_audio_url }
  }
  return undefined
}

function reviewSegments(value) {
  if (!Array.isArray(value)) return undefined
  return value.map(segment => {
    if (!segment || typeof segment !== 'object' || Array.isArray(segment)) return segment
    return pick(segment, reviewSegmentKeys)
  })
}

function reviewShots(value) {
  if (!Array.isArray(value)) return undefined
  return value.map(shot => {
    if (!shot || typeof shot !== 'object' || Array.isArray(shot)) return shot
    return pick(shot, ['id', 'from', 'to', 'description', 'segment_ids', 'confirmed'])
  })
}

function mapValues(value, transform) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  return Object.fromEntries(Object.entries(value).map(([key, row]) => [key, transform(row)]))
}

function sentences(value) {
  if (!Array.isArray(value)) return undefined
  return value.map(sentence => ({
    ...pick(sentence, ['text', 'begin_time', 'end_time', 'sentence_id', 'language', 'emotion', 'speaker_id']),
    ...(Array.isArray(sentence?.words) ? { words: sentence.words.map(word => pick(word, ['text', 'punctuation', 'begin_time', 'end_time'])) } : {}),
  }))
}

function languageResult(value) {
  const out = pick(value, ['status', 'error_message', 'output_video_url', 'translated_video_url', 'no_subtitle_video_url',
    'lip_sync_video_url', 'audio_url', ...warningKeys])
  if (Array.isArray(value?.voice_over_clips)) out.voice_over_clips = value.voice_over_clips.map(clip => pick(clip, ['from', 'to', 'text', 'audio_url', 'speed', 'keep_original_voice', 'lip_sync', 'lip_sync_video_url']))
  if (Array.isArray(value?.subtitle_asr_sentences)) out.subtitle_asr_sentences = sentences(value.subtitle_asr_sentences)
  if (Array.isArray(value?.translated_segments_snapshot)) out.translated_segments_snapshot = reviewSegments(value.translated_segments_snapshot)
  return out
}

function publicResult(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result) || !Array.isArray(result.items)) return undefined
  const items = result.items.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item
    const output = pick(item, reviewItemKeys)
    if (item.split_part != null) output.split_part = pick(item.split_part, ['group_id', 'index', 'from', 'to', 'source_duration', 'source_video_url'])
    const voice = defaultVoice(item.default_voice)
    if (voice !== undefined) output.default_voice = voice
    const asr = reviewSegments(item.asr_segments)
    const translated = reviewSegments(item.translated_segments)
    const translatedByLanguage = item.translated_segments_by_language && typeof item.translated_segments_by_language === 'object' && !Array.isArray(item.translated_segments_by_language)
      ? Object.fromEntries(Object.entries(item.translated_segments_by_language).map(([language, segments]) => [language, reviewSegments(segments)]))
      : undefined
    const shots = reviewShots(item.storyboard_shots)
    if (asr !== undefined) output.asr_segments = asr
    if (translated !== undefined) output.translated_segments = translated
    if (translatedByLanguage !== undefined) output.translated_segments_by_language = translatedByLanguage
    if (shots !== undefined) output.storyboard_shots = shots
    if (Array.isArray(item.speaker_voice_mappings)) output.speaker_voice_mappings = item.speaker_voice_mappings.map(mapping => pick(mapping, ['speaker_id', 'audio_id', 'reference_audio_url']))
    if (item.resynthesis_by_language) output.resynthesis_by_language = mapValues(item.resynthesis_by_language, receipt => pick(receipt, ['request_id', 'status', 'error_message']))
    if (item.results_by_language) output.results_by_language = mapValues(item.results_by_language, languageResult)
    return output
  })
  return {
    ...pick(result, ['phase', 'mode', 'source_language', 'target_language', 'error_message']),
    ...(defaultVoice(result.default_voice) !== undefined ? { default_voice: defaultVoice(result.default_voice) } : {}),
    ...(object(result.split_outputs) ? {
      split_outputs: mapValues(result.split_outputs, languages => mapValues(languages,
        value => pick(value, ['status', 'output_video_url', 'error_message', ...warningKeys]))),
    } : {}),
    items,
  }
}

function reviewDetails(result) {
  return typeof result?.phase === 'string' ? publicResult(result) : undefined
}

function splitGroup(item) {
  const id = item.split_part?.group_id
  if ((typeof id === 'string' && id.trim()) || Number.isSafeInteger(id)) return String(id)
}

function groupVideos(items, base) {
  const videos = []
  const groups = new Map()
  for (const [index, item] of items.entries()) {
    if (!object(item)) throw new VibbitError('protocol', 'Malformed translation item', base)
    if (item.split_part == null) {
      videos.push({ index, item })
      continue
    }
    const group = splitGroup(item)
    if (group === undefined) {
      videos.push({ index, item, parts: [item] })
      continue
    }
    if (!groups.has(group)) {
      const video = { index, item, group, parts: [] }
      groups.set(group, video)
      videos.push(video)
    }
    groups.get(group).parts.push(item)
  }
  return videos
}

function videoArtifacts(value, identity, warningCode = value?.rendering_warning_code) {
  if (!usable(value?.output_video_url)) return []
  const variant = warningCode === 'SUBTITLED_VERSION_UNAVAILABLE' ? 'no_subtitles'
    : warningCode === 'NO_SUBTITLE_VERSION_UNAVAILABLE' ? 'subtitles' : undefined
  const video = { ...identity, kind: 'video', role: 'generated', url: value.output_video_url }
  if (variant) return [{ ...video, variant }]
  return usable(value.no_subtitle_video_url) && value.no_subtitle_video_url !== video.url
    ? [video, { ...video, variant: 'no_subtitles', url: value.no_subtitle_video_url }] : [video]
}

function addRenderingWarning(warnings, source, identity) {
  const details = pick(source, warningKeys)
  if (Object.keys(details).length) warnings.push({ ...identity, ...details })
}

function fullVideoOutputs({ group, parts }, result, target, identity, parentFailed, warnings) {
  if (group === undefined) return {
    outputs: [], pending: [], failures: [{ ...identity, reason: 'Split video is missing its group_id' }],
  }
  const byLanguage = lookup(result.split_outputs, group)
  const languages = new Set([
    ...(target?.languages ?? parts.flatMap(part => [
      ...(Array.isArray(part.target_languages) ? part.target_languages : []),
      ...Object.keys(part.results_by_language || {}),
    ])),
    ...Object.keys(byLanguage || {}),
  ].filter(language => typeof language === 'string' && language.trim()))
  if (!languages.size && typeof result.target_language === 'string' && result.target_language.trim()) languages.add(result.target_language)
  const outputs = [], pending = [], failures = []
  if (!languages.size) failures.push({ ...identity, reason: 'Missing target language for the split video' })
  for (const language of languages) {
    const final = lookup(byLanguage, language)
    const scope = { ...identity, language }
    addRenderingWarning(warnings, final, scope)
    if (final?.status === 'COMPLETED') {
      const delivered = videoArtifacts(final, scope)
      outputs.push(...delivered)
      if (!delivered.length) failures.push({ ...scope, reason: 'Complete split video is missing output_video_url' })
    } else if (!parentFailed && (!final?.status || ['PENDING', 'RUNNING'].includes(final.status))) {
      pending.push(scope)
    } else {
      failures.push({ ...scope, reason: final?.error_message || 'Complete split video is unavailable' })
    }
  }
  return { outputs, pending, failures }
}

const fingerprint = value => typeof value === 'string' ? crypto.createHash('sha256').update(value).digest('hex') : undefined

function matchTarget({ item, parts }, targets) {
  const clientId = (parts?.find(part => typeof part.client_item_id === 'string' && part.client_item_id.trim()) ?? item).client_item_id
  const id = typeof clientId === 'string' && clientId.trim() ? fingerprint(clientId) : undefined
  const childSource = parts?.find(part => usable(part.split_part?.source_video_url))?.split_part.source_video_url
  const source = fingerprint(parts ? childSource : item.source_video_url || item.video_url)
  const byId = id ? targets.filter(target => target.client_item_id_sha256 === id) : []
  const matches = byId.length ? byId : targets.filter(target =>
    source && target.source_sha256 === source && (!id || !target.client_item_id_sha256))
  return matches.length === 1 ? matches[0] : undefined
}

function translationResult(base, result, expected) {
  if (!['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'INSUFFICIENT_POINTS'].includes(base.status)) throw new VibbitError('protocol', 'Unknown translation task status', base)
  const parentFailed = ['FAILED', 'INSUFFICIENT_POINTS'].includes(base.status)
  const insufficientPointsMessage = base.status === 'INSUFFICIENT_POINTS'
    ? 'Insufficient points; check the account balance before starting another task' : undefined
  if (['PENDING', 'RUNNING'].includes(base.status)) {
    const review = reviewDetails(result)
    return {
      ok: true,
      ...base,
      ...(result !== undefined ? { result: review || publicResult(result) || result } : {}),
      review_visibility: review ? 'available' : 'unavailable',
      ...(review ? { review } : {}),
    }
  }
  if (!result || !Array.isArray(result.items) || !result.items.length) {
    if (parentFailed) return { ok: false, ...base, result, artifacts: [], delivery_kind: 'translation', failures: [{ reason: result?.error_message || insufficientPointsMessage || 'Task failed without item results' }] }
    throw new VibbitError('protocol', 'Translation completed without item results; do not claim delivery', base)
  }
  const artifacts = [], failures = [], pending = [], items = [], renderingWarnings = []
  const videos = groupVideos(result.items, base)
  const targets = expected?.map((target, index) => ({ ...target, index }))
  const matched = new Set()
  let requested_languages_checked = Boolean(targets)
  for (const video of videos) {
    const { index, item, group, parts } = video
    const sub_task_id = item.sub_task_id === undefined ? undefined : String(item.sub_task_id)
    const identity = { item_index: index, ...(group ? { group_id: group } : sub_task_id ? { sub_task_id } : {}) }
    let target = targets && matchTarget(video, targets)
    if (targets) {
      if (!target || matched.has(target.index)) {
        requested_languages_checked = false
        target = undefined
      } else matched.add(target.index)
    }
    if (parts) {
      const full = fullVideoOutputs(video, result, target, identity, parentFailed, renderingWarnings)
      artifacts.push(...full.outputs)
      failures.push(...full.failures)
      pending.push(...full.pending)
      const status = full.pending.length ? 'RUNNING' : full.failures.length ? 'FAILED' : 'COMPLETED'
      items.push({ ...identity, status, outputs: full.outputs })
      continue
    }
    const outputs = []
    addRenderingWarning(renderingWarnings, item, identity)
    if (item.status === 'COMPLETED') {
      const langs = item.results_by_language
      if (object(langs) && Object.keys(langs).length) {
        for (const [language, v] of Object.entries(langs)) {
          const scope = { ...identity, language }
          addRenderingWarning(renderingWarnings, v, scope)
          const warning = v?.rendering_warning_code ?? (Object.keys(langs).length === 1 ? item.rendering_warning_code : undefined)
          const delivered = videoArtifacts(v, scope, warning)
          if (delivered.length) outputs.push(...delivered)
          else failures.push({ ...scope, reason: 'Missing final output_video_url' })
        }
      } else if (usable(item.output_video_url)) outputs.push(...videoArtifacts(item, identity))
      else failures.push({ ...identity, reason: 'Missing final output_video_url' })
      if (target) {
        if (target.languages.length === 1 && outputs.every(output => output.language === undefined)) {
          for (const output of outputs) output.language = target.languages[0]
        }
        for (const language of target.languages) {
          if (!outputs.some(output => output.language === language)) failures.push({ item_index: index, language, reason: 'Requested language has no final output' })
        }
      }
    } else failures.push({ ...identity, status: item.status, reason: item.error_message || 'Item did not complete successfully' })
    artifacts.push(...outputs)
    items.push({ ...identity, status: item.status, outputs, ...(item.error_message ? { error_message: item.error_message } : {}) })
  }
  if (targets) {
    if (videos.length < targets.length) failures.push({ reason: 'Fewer video results than submitted items', expected: targets.length, returned: videos.length })
    if (matched.size !== targets.length) requested_languages_checked = false
  }
  if (parentFailed) failures.push({ reason: result.error_message || insufficientPointsMessage || 'Parent translation task failed; successful final outputs are retained' })
  // Source and intermediate media stay in result, never in delivery artifacts.
  const failed = failures.length > 0 || parentFailed
  const review = reviewDetails(result)
  return { ok: !failed, ...base, result: publicResult(result), ...(review ? { review, review_visibility: 'available' } : {}), items, artifacts, delivery_kind: 'translation', requested_languages_checked,
    ...(pending.length ? { status: 'RUNNING', parent_status: base.status, delivery_pending: true, pending_outputs: pending } : {}),
    ...(renderingWarnings.length ? { rendering_warnings: renderingWarnings } : {}),
    ...(!requested_languages_checked ? { warnings: ['Requested-language coverage is not fully verified; compare the returned files with the original request.'] } : {}),
    ...(failed ? { failures, ...(artifacts.length ? { partial_failure: true } : {}) } : {}) }
}

function translationAction(output, context) {
  if (!context) return output
  const previous = output.artifacts?.length ? output.artifacts : (output.result?.items || []).flatMap(item =>
    item.split_part != null ? [] : Object.entries(item.results_by_language || {}).flatMap(([language, result]) =>
      videoArtifacts(result, { sub_task_id: String(item.sub_task_id), language })))
  const common = { ...output, operation: context.operation, parent_status: output.parent_status ?? output.status,
    operation_context: pick(context, ['operation', 'sub_task_id', 'target_language', 'request_id']),
    artifacts: [], ...(previous.length ? { previous_artifacts: previous } : {}), delivery_current: false }
  if (context.operation === 'retry_sub_task') return retryLanguageResult(common, languageTarget(output.result, context), context)
  if (context.operation !== 'resynthesize_language') return {
    ...common, operation_status: 'ACKNOWLEDGED', render_performed: false,
  }
  const target = languageTarget(output.result, context)
  const receipt = lookup(target.item?.resynthesis_by_language, context.target_language)
  if (!receipt || receipt.request_id !== context.request_id) {
    if (['FAILED', 'INSUFFICIENT_POINTS'].includes(output.status)) return { ...common, ok: false, operation_status: 'UNCONFIRMED' }
    return { ...common, ok: true, status: 'RUNNING', operation_status: 'AWAITING_RECEIPT', partial_failure: false }
  }
  if (!['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'].includes(receipt.status)) throw new VibbitError('protocol', 'Unknown language resynthesis receipt status', { task_id: output.task_id })
  if (receipt.status === 'FAILED') return { ...common, ok: false, status: 'FAILED', operation_status: 'FAILED', partial_failure: false,
    failures: [{ sub_task_id: context.sub_task_id, language: context.target_language, request_id: context.request_id, reason: receipt.error_message || 'Language resynthesis failed; the previous delivery is preserved' }] }
  if (receipt.status !== 'COMPLETED') return { ...common, ok: true, status: receipt.status, operation_status: receipt.status, partial_failure: false }
  if (target.split && target.final?.status !== 'COMPLETED') {
    if (target.final?.status === 'FAILED') return languageFailure(common, context, target.final.error_message || 'Complete split video failed')
    return { ...common, ok: true, status: 'RUNNING', operation_status: 'AWAITING_FULL_VIDEO', delivery_pending: true, partial_failure: false }
  }
  if (!usable(target.final?.output_video_url)) throw new VibbitError('protocol', 'Language resynthesis completed without its final output_video_url', { task_id: output.task_id })
  return completedLanguage(common, target, context)
}

function languageTarget(result, context) {
  const item = result?.items?.find(row => String(row?.sub_task_id) === context.sub_task_id)
  const languages = item?.target_languages
  const singleLanguage = Array.isArray(languages) && languages.length === 1 && languages[0] === context.target_language
  const locale = lookup(item?.results_by_language, context.target_language)
  const video = locale ?? (singleLanguage ? item : undefined)
  const split = item?.split_part != null
  const group = item && splitGroup(item)
  const full = group === undefined ? undefined : lookup(lookup(result?.split_outputs, group), context.target_language)
  const final = split ? full : video
  return { item, video, split, group, final, status: locale?.status ?? item?.status, scoped: typeof locale?.status === 'string' || singleLanguage }
}

function stableVideoHash(value) {
  if (!usable(value)) return null
  const url = new URL(value)
  return fingerprint(url.origin + url.pathname)
}

function retryBaseline(result, context) {
  const target = languageTarget(result, context)
  if (!target.item) throw new VibbitError('input', 'The sub_task_id was not found in the original translation task')
  const languages = target.item.target_languages
  if (Array.isArray(languages) && languages.length && !languages.includes(context.target_language)) {
    throw new VibbitError('input', 'The target language is not configured for this video')
  }
  if (![target.item.status, target.status].every(status => ['COMPLETED', 'FAILED'].includes(status))) {
    throw new VibbitError('input', 'Retry requires a terminal video and target language')
  }
  return { status: target.status, video_url_sha256: stableVideoHash(target.video?.output_video_url),
    ...(target.split ? { full_video_url_sha256: stableVideoHash(target.final?.output_video_url) } : {}) }
}

function languageFailure(common, context, reason) {
  return { ...common, ok: false, status: 'FAILED', operation_status: 'FAILED', partial_failure: false,
    failures: [{ sub_task_id: context.sub_task_id, language: context.target_language, request_id: context.request_id, reason }] }
}

function retryLanguageResult(common, target, context) {
  const baseline = context.retry_baseline
  const pending = { ...common, ok: true, status: 'RUNNING', operation_status: 'AWAITING_UPDATED_VIDEO', partial_failure: false }
  if (!baseline || !context.retry_acknowledged) return { ...pending, operation_status: 'UNCONFIRMED' }
  if (['PENDING', 'RUNNING'].includes(target.status)) return {
    ...pending, operation_status: target.status, ...(target.scoped ? { target_retry_active: true } : {}),
  }
  if (target.status === 'FAILED' && (baseline.status !== 'FAILED' || context.retry_observed_active)) {
    return languageFailure(common, context, target.video?.error_message || target.item.error_message || 'Language retry failed')
  }
  const newVideo = stableVideoHash(target.video?.output_video_url)
  const updated = newVideo && (newVideo !== baseline.video_url_sha256 || (target.scoped && context.retry_observed_active))
  if (target.status !== 'COMPLETED' || !updated) return pending
  if (target.split) {
    if (target.final?.status === 'FAILED') return languageFailure(common, context, target.final.error_message || 'Complete split video failed')
    const full = stableVideoHash(target.final?.output_video_url)
    if (target.final?.status !== 'COMPLETED' || !full || full === baseline.full_video_url_sha256) {
      return { ...pending, operation_status: 'AWAITING_FULL_VIDEO', delivery_pending: true }
    }
  }
  return completedLanguage(common, target, context)
}

function completedLanguage(common, target, context) {
  const scope = { ...(target.split ? { group_id: target.group } : { sub_task_id: context.sub_task_id }), language: context.target_language }
  const warningSource = target.final.rendering_warning_code || target.final.rendering_warning_message
    ? target.final : !target.split && target.item.target_languages?.length === 1 ? target.item : undefined
  const artifacts = videoArtifacts(target.final, scope, warningSource?.rendering_warning_code)
  const renderingWarnings = []
  addRenderingWarning(renderingWarnings, warningSource, scope)
  const { previous_artifacts, rendering_warnings, pending_outputs, ...delivered } = common
  return { ...delivered, ok: true, status: 'COMPLETED', operation_status: 'COMPLETED', delivery_current: true, artifacts,
    failures: [], partial_failure: false, requested_languages_checked: true, delivery_pending: false,
    ...(renderingWarnings.length ? { rendering_warnings: renderingWarnings } : {}),
    warnings: (common.warnings || []).filter(value => !value.startsWith('Requested-language coverage')) }
}
module.exports = { translationResult, reviewDetails, translationAction, retryBaseline, sourceVideoRecovery }
