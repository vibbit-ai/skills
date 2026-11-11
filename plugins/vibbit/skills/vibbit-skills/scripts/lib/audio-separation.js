'use strict'

const { VibbitError } = require('./client')
const { long } = require('./translation')
const { publicUrl } = require('./media')

// Public model numbers and exact stems, including spaces, from the task-result contract.
const models = {
  1: { vocals: 'Vocals', drums: 'Drums', bass: 'Bass', guitar: 'Guitar', piano: 'Piano', other: 'Other' },
  ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i + 2, { vocals: 'Vocals', background: 'Accompaniment' }])),
  10: { male: 'Male voice', female: 'Female voice' },
  12: { aspiration: 'Breath / aspiration', other: 'Other audio' },
  13: { aspiration: 'Breath / aspiration', other: 'Other audio' },
  14: { noreverb: 'Without reverb', reverb: 'Reverb' },
  15: { dry: 'Dry audio', other: 'Other audio' },
  16: { dry: 'Dry audio', other: 'Other audio' },
  17: { dry: 'Dry audio', 'no dry': 'Residual audio' },
  18: { noreverb: 'Without reverb', reverb: 'Reverb' },
  19: { 'no drum-bass': 'Without drums and bass', 'drum-bass': 'Drums and bass' },
  20: { kick: 'Kick drum', snare: 'Snare drum', toms: 'Toms', hh: 'Hi-hat', ride: 'Ride cymbal', crash: 'Crash cymbal' },
  21: { vocals: 'Backing vocals', instrumental: 'Without backing vocals' },
}

function validateSeparation(input) {
  long(input.material_id, 'material_id')
  if (input.model !== undefined && (!Number.isSafeInteger(input.model) || !models[input.model])) {
    throw new Error('Separation model must be 1..10 or 12..21; model 11 is unsupported')
  }
}

function checkSeparationMaterial(material, materialId) {
  const reject = message => { throw new VibbitError('input', message, { ambiguous: false }) }
  if (!material || String(material.material_id) !== String(materialId)) reject('Separation source detail has a different material ID')
  if (!['AUDIO', 'VIDEO'].includes(material.media_type)) reject('Separation requires a library AUDIO or VIDEO material')
  const duration = material.file_info?.duration
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0 || duration > 1800) {
    reject('Separation source must have a server-reported duration >0 and <=1800 seconds; no task was submitted')
  }
}

function separationResult(result, model) {
  const fail = message => { throw new VibbitError('protocol', message) }
  const checkUrl = url => {
    try { publicUrl(url, 'separated audio URL', 4096) } catch { fail('Separation result contains an invalid audio URL') }
    return url
  }
  if (!result || typeof result !== 'object' || Array.isArray(result)) fail('Separation result must be an object')
  const legacy = result.vocal_audio_url !== undefined || result.background_audio_url !== undefined
  let tracks
  if (legacy) {
    if (result.tracks !== undefined || (model !== undefined && !(model >= 2 && model <= 9))) fail('Separation result does not match its submitted model')
    tracks = [{ stem: 'vocals', label: 'Vocals', audio_url: checkUrl(result.vocal_audio_url) },
      { stem: 'background', label: 'Accompaniment', audio_url: checkUrl(result.background_audio_url) }]
  } else {
    if (!Array.isArray(result.tracks) || !result.tracks.length || result.tracks.length > 6) fail('Separation result is missing its audio tracks')
    const stems = result.tracks.map(track => track?.stem)
    if (stems.some(stem => typeof stem !== 'string' || !stem.trim() || stem.length > 100) || new Set(stems).size !== stems.length) fail('Separation result contains invalid or duplicate stems')
    if (model !== undefined && (!models[model] || (model >= 2 && model <= 9)
      || stems.length !== Object.keys(models[model]).length || stems.some(stem => !Object.hasOwn(models[model], stem)))) fail('Separation tracks do not match the submitted model; preserve the task and query it again')
    // Without the submitted model, a stem is an identifier, not a semantic label.
    tracks = result.tracks.map(track => ({ stem: track.stem,
      ...(model !== undefined ? { label: models[model][track.stem] } : {}), audio_url: checkUrl(track.audio_url) }))
  }
  return { ...(model !== undefined ? { model } : {}), model_context_required: !legacy && model === undefined,
    tracks, temporary_urls: true, refresh: 'Query the original task to refresh expired signed URLs; never resubmit for a download.' }
}

module.exports = { separationModels: models, validateSeparation, checkSeparationMaterial, separationResult }
