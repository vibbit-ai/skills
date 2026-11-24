# Voices

## Select a platform voice and read the supplied text

1. Run `vibbit.js list_voices` to get each available voice with its `name`, string `voice_id`, and `preview_url`. Play the supplied audio URL when available. An unconfigured preview is `null`. Reuse an explicitly selected ID. Ask the user to choose if several voices match the same name.
2. Put the adopted script verbatim in a JSON file, for example `{"text":"Welcome to the show.","voice_id":"1234567890123456789"}`, replacing the example ID. Run `vibbit.js text_to_speech --input /absolute/path/speech.json --submission-id <unique-submission-id>`. Text can contain up to 10,000 characters. The platform voice settings control speech rate and volume.
3. The synchronous result contains the MP3 `audio_url` and optional `duration_seconds`. After review, use the URL directly for [avatar video](../api/digital_human_video.md) or editing. The request defaults to a 120-second budget, adjustable with `--timeout-seconds`. Repeated submissions incur another charge. Keep the submission record and check the outcome after a timeout.

[Voice list](https://vibbit.apifox.cn/532562398e0) · [Text to speech](https://vibbit.apifox.cn/532562427e0)

For prompt-directed speech with a selected platform voice, [prepare its preview](../api/generate_audio.md#prepare-a-platform-voice-preview). Use an eligible `preview_url` directly in `reference_audio_urls`. For a preview over 30 seconds, clip and verify it first and use the uploaded clip's `object_url`. Use `@音频1` (or the actual reference index) in `text_prompt` to describe which voice or delivery qualities to borrow for the current script. If the preview is null, absent, or inaccessible, use another suitable reference or ask for an audio file. Fixed-script TTS uses `voice_id`. Audio references influence generation without creating a reusable voice asset.

Video translation preserves original voices by default. For an explicit replacement request, follow [voice intent and scope](../capabilities/processing/video-translation.md#voice-intent-and-scope) and explain unified versus targeted changes. At creation, default_voice.reference_audio_url accepts an MP3 URL from generic upload, not audio_id or a video-level override. Existing tasks can also use their task-scoped audio uploader for speaker bindings.

Digital-human listing may return `voice`, but its public fields include no voice-preview URL and audio generation accepts no `voice_id`. Do not treat that field as a selectable TTS voice or reference material. Show a genuine existing preview when supplied with established meaning. Audio generation accepts an uploaded object_url directly in reference_audio_urls, without material registration; real audio-library IDs remain supported.

For an existing translation task, [translation voice revisions](../api/translation-revision.md) bind a reference MP3 or real audio_id to an ASR speaker. Preserve all other bindings, retry affected speech and render only the needed language. This does not create or list reusable voice assets and does not replace the visible performer.

Reuse existing audio when the user wants to preserve it. For an explicitly supplied voice resource, retain its real fields and ID. Prefer an existing preview to generating an extra paid sample; additional generation needs appropriate authorization. See [audio generation](../capabilities/generation/audio-generation.md).
