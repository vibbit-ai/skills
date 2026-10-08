# Speech transcription

Use [breakdown](../../api/breakdown.md) with `sub_tasks: ["asr"]` for supported video/share URLs. The public contract does not establish standalone-audio input, speaker diarization, or word-level alignment.

Preserve actual segment `from`, `to`, and `content` values. A continuous script, formatted subtitles, and a translation are derived outputs and should retain their relation to the source. Check task state before treating an empty response as silence.

Request only `asr` when transcription is all that is needed, without unrelated camera, music, or viral-content analysis. Captions and speech checks share the same applicable result. Reuse earlier timing only after establishing that the adopted soundtrack and its offset, trimming, and speed are unchanged; the same video duration alone is insufficient. New audio needs new timing evidence.

Preserve raw recognition, the adopted script, and actual speech separately. For mixed languages, numbers, names, or background music, listen to flagged passages before attributing errors to audio generation. Agreement between recognizers cannot replace listening evidence.

Routine production should not install Whisper, download models, or wait for new verification dependencies solely to cross-check speech. Use the existing official ASR and host listening capabilities; state unverified checks. Use another tool when specifically needed and supported by the environment and user's request.

Standalone audio ASR is not publicly established. Do not claim it is integrated or default to converting audio into video, uploading it, and transcribing it as a validation workaround. Existing videos can provide segment captions. Explain the missing capability when pre-render automatic audio checking or exact word synchronization is required.

Burning subtitles is a separate operation. Use [subtitle correction and segmentation](../processing/subtitle-addition.md); precise word events follow [script and timing](../../creation/script-and-timing.md), without fabricated word boundaries.
