# Audio generation: generate_audio

Use the asynchronous task type `AI_GENERATE_AUDIO` to generate audio.

[API reference](https://vibbit.apifox.cn/513300730e0)

Generate speech, BGM, sound effects or a combined audio track through text_prompt. Pass accessible audio URLs directly in reference_audio_urls, or use existing reference_material_ids. Preserve the script and verify the resulting audio; voice_id is not an input field.

## Inputs

Client fields and minimum requirements follow; the server may impose additional checks.

| Field | Type | Required |
| --- | --- | --- |
| `text_prompt` | string | Yes |
| `format` | string | No |
| `sample_rate` | integer | No |
| `speech_rate` | integer | No |
| `loudness_rate` | integer | No |
| `pitch_rate` | integer | No |
| `max_duration_seconds` | integer | No |
| `reference_material_ids` | ids | No |
| `reference_audio_urls` | urls | No |
| `reference_image_urls` | urls | No |

Replace example URLs/IDs with real accessible assets and resources before submitting.

~~~json
{
  "text_prompt": "A natural English male voice says: \"Welcome to the show.\" Soft background music supports the voice, with one light chime at the end. Add no other speech.",
  "format": "mp3",
  "sample_rate": 48000
}
~~~

## Call

~~~bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" generate_audio --input /absolute/path/request.json --dry-run
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" generate_audio --input /absolute/path/request.json
~~~

The client uses `input_info.input = JSON.stringify(input)` inside the input_info object. Do not change encoding and automatically resubmit after an error.



[Authentication](../runtime/authentication.md) · [Task lifecycle](../runtime/task-lifecycle.md) · [Troubleshooting](../runtime/troubleshooting.md)

## Voice, music, effects, and controls

Speech/narration, background music, effects, and ambience can be generated independently or together. A music example in the API docs does not restrict it to music. Combined audio does not imply separate stems.

- text_prompt: required, by default at most 3000 characters; include exact speech, sound design, reference roles, and timing.
- format: mp3 or wav; server default mp3.
- sample_rate: by default 16000, 24000, or 48000 Hz; server default 48000.
- speech_rate / loudness_rate: integer -50..100; server default 0.
- pitch_rate: integer -12..12; server default 0.
- max_duration_seconds: integer 1..120 by default; server default 120. This is an upper bound, not an exact output length.
- reference_audio_urls: HTTP(S) audio URLs accessible to the server and provider, including a suitable voice preview or the `object_url` of an uploaded clip.
- reference_material_ids: real audio-library IDs belonging to the current tenant and workspace; preserve signed 64-bit precision with decimal strings.
- reference_image_urls: HTTP(S) image URLs, referenced with independent literal tokens such as `@图片1`.

Optional values are not automatically filled by the CLI. Omit unused reference arrays; supplied arrays must be nonempty. Describe voice gender, emotion, and delivery in text_prompt. No voice_id field is defined; an ID is not required for prompt-based speech.

## Audio reference requirements

After `upload_info --file`, put the actual `object_url` in `reference_audio_urls`. Reuse accessible URLs that meet the input limits. Material-library registration is optional. Replace the example URL with a real one:

~~~json
{
  "text_prompt": "Use the voice character of @音频1 to say: Welcome to the show.",
  "reference_audio_urls": ["https://example.com/reference.mp3"],
  "format": "mp3",
  "sample_rate": 48000,
  "max_duration_seconds": 30
}
~~~

| Default constraint | Limit |
| --- | --- |
| Count | At most 3 audio references after merging and deduplicating IDs and URLs |
| Per audio | 2–30 seconds; at most 15 MiB |
| Combined audio | At most 90 seconds and 45 MiB |
| Mixed inputs | Resolve IDs first, then URLs; number references in the deduplicated order |
| Prompt tokens | A single audio reference gets `@音频1` automatically; multiple references require explicit tokens within the final count |

For example, an ID resolves to audio A and the URL array contains A's URL followed by B's URL: `@音频1` refers to A and `@音频2` to B. Preserve these literal service tokens rather than translating them. Replacing, deleting, or reordering references requires corresponding prompt updates. Images have independent `@图片1` tokens and do not consume audio numbers.

Use an existing `ffprobe` to check for a local file's audio stream, duration, and size before upload.

~~~bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" probe --file /absolute/path/voice-reference.mp3 --profile audio-reference
~~~

If the sample is too large, check a separately compressed copy or choose a different sample. Check actual media metadata for remote samples, including `preview_url`. Leave an unknown duration or size pending service validation.

The CLI checks URL syntax, ID types, and numeric ranges, and rejects more than three distinct audio URLs. It preserves the reference arrays and prompt text. The server resolves materials, deduplicates across IDs and URLs, and validates final counts, tokens, reachability, duration, and size. A local path, object URL, or voice ID is not a library material ID. Prompt-only generation can proceed without references.

For voice-only, specify no music/effects; for music, specify whether vocals are wanted; for an effect, specify its source/action/duration. Do not add sounds merely to exercise the API.

Preserve task_id/journal, query to completion, and inspect the actual audio/metadata. Pass an accessible resulting audio_url directly to [digital-human video](digital_human_video.md); no download/reupload is needed. See [audio capability](../capabilities/generation/audio-generation.md) and [voices](../resources/voices.md).

### Prepare a platform voice preview

Reuse a verified, accessible `preview_url` when it meets the limits. Clip any preview over 30 seconds before submitting generation. Use the host's available media access to save the selected preview to a task-local file. When duration is unknown and a local copy is available, use the same command to inspect it and clip it if needed.

~~~bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" probe --file /absolute/path/voice-preview.mp3 --profile audio-reference --trim-output /absolute/path/voice-reference.wav
~~~

Use an existing `ffprobe` installation and `ffmpeg` for clipping. For an overlong sample, the command saves and checks a separate WAV containing the first 30 seconds. On `trimmed: true`, upload the returned `file` through [media upload](upload_info.md) and put its actual `object_url` in the same `reference_audio_urls` position. On `trimmed: false`, reuse the accessible original URL. If clipping or verification is unavailable, use a verified shorter sample of the same voice or explain what is missing and request a suitable sample.
