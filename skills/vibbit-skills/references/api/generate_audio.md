# Audio generation: generate_audio

Task type: `AI_GENERATE_AUDIO`. Mode: `async`; actual behavior and account access depend on the response.

[API reference](https://vibbit.apifox.cn/513300730e0)

Generate speech, BGM, sound effects or a combined audio track through text_prompt. Use reference_material_ids for accessible audio materials. Preserve the script and verify the resulting audio; voice_id is not an input field.

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

- text_prompt: required, at most 3000 characters; include exact speech, sound design, reference roles, and timing.
- format: mp3 or wav.
- sample_rate: 16000, 24000, or 48000 Hz.
- speech_rate / loudness_rate: integer -50..100; normally 0.
- pitch_rate: integer -12..12; normally 0.
- max_duration_seconds: integer 1..120; this does not guarantee exact duration. Do not truncate long narration to a sample's 10-second value.
- reference_material_ids: a nonempty ordered array of real accessible audio-library IDs, at most 3; preserve signed 64-bit precision with decimal strings.

Optional values are not automatically filled. Describe voice gender, emotion, and delivery in text_prompt. No voice_id field is defined; an ID is not required for prompt-based speech.

Use the service's reference tokens `@音频1`, `@音频2`, `@音频3` in the same order as reference_material_ids. These are literal model-input tokens, not prose to translate. A local path, object URL, or voice ID is not a library material ID. Upload alone does not obtain one; obtain a supported registration result before reference-based generation. Prompt-only generation can proceed without references.

For voice-only, specify no music/effects; for music, specify whether vocals are wanted; for an effect, specify its source/action/duration. Do not add sounds merely to exercise the API.

Preserve task_id/journal, query to completion, and inspect the actual audio/metadata. Pass an accessible resulting audio_url directly to [digital-human video](digital_human_video.md); no download/reupload is needed. See [audio capability](../capabilities/generation/audio-generation.md) and [voices](../resources/voices.md).
