# Video translation: translate_video

Task type: `VIDEO_VOICE_OVER_TASK`. Mode: `async`; actual behavior and account access depend on the response.

[Submission and operations](https://vibbit.apifox.cn/515705766e0) · [Task query](https://vibbit.apifox.cn/515706553e0). See [translation revisions](translation-revision.md) for voice changes, speech retries and rendering one language again.

Set auto_translate explicitly. With auto_translate=false, query the returned task until task_result.result exposes the safe review details and phase before editing or confirming.

Ordinary packaging and dynamic subtitles can be configured on the task or individual videos. Dynamic subtitles use `template_type=1` and a verified `subtitle_template_id`. See [subtitle templates](../resources/subtitle-templates.md).

## Prepare the source video

Prefer a material-library video for automatic, review-first, and subtitle-only translation. Submit its verified `material_id` and the same video's `source_video.url` in one item. The API requires the source URL.

1. Reuse an existing material ID in the current workspace, including an already registered generation output. Prefer the original `file_info.url` from [material detail](material-queries.md). A verified, accessible direct link to the same video also works.
2. For a new local video, use [media upload](upload_info.md) to get its actual `object_url`. [Import the video](import_material_videos.md) from that URL or an existing external link. Use `auto_ingest: false` for translation alone. [Check the original import](get_material_import.md) until the item is `IMPORTED` and has a real `material_id`. Then submit the translation with that ID and its source URL.
3. Use a URL-only fallback when you confirm a material ID is unavailable or the user requests translation without library storage. Set `source_video.url` to the readable HTTP(S) video URL and omit `material_id` for that item. Use the actual upload `object_url` for local media, or resolve a share page through [external video acquisition](../runtime/external-video.md). For a partial import, use the verified IDs of successful items.

## Inputs

Client fields and minimum requirements follow; the server may impose additional checks.

| Field | Type | Required |
| --- | --- | --- |
| `operation` | string (`create`) | No |
| `mode` | string (`VOICE_OVER` or `SUBTITLE_ONLY`) | No |
| `business_id` | id | No |
| `task_name` | string | No |
| `source_language` | string | No |
| `target_language` | string | No |
| `translation_style` | string | No |
| `default_speed` | number | No |
| `auto_translate` | boolean | Yes |
| `subtitle_enabled` | boolean | No |
| `lip_sync_enabled` | boolean | No |
| `remove_subtitles_enabled` | boolean | No |
| `align_original_subtitle_position` | boolean | No |
| `translate_and_align_original_title` | boolean | No |
| `persona_mode` | string | No |
| `template_type` | integer | No |
| `template_configs` | objects | No |
| `default_digital_human_id` | id | No |
| `default_prompt` | string | No |
| `default_voice` | object or null | No |
| `settings` | object | No |
| `items` | objects | Yes |

Replace example URLs/IDs with real accessible assets and resources before submitting.

~~~json
{
  "auto_translate": true,
  "target_language": "en",
  "items": [
    {
      "material_id": "2100065567327711232",
      "source_video": {
        "url": "https://example.com/source.mp4"
      }
    }
  ]
}
~~~

## Call

~~~bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" translate_video --input /absolute/path/request.json --dry-run
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" translate_video --input /absolute/path/request.json
~~~

The client sends a native object in `input_info.input`. Do not change encoding and automatically resubmit after an error.



[Authentication](../runtime/authentication.md) · [Task lifecycle](../runtime/task-lifecycle.md) · [Troubleshooting](../runtime/troubleshooting.md)

## Input constraints and defaults

| Field | Rules |
| --- | --- |
| items | 1–100 videos. Each item requires source_video.url. Prefer also supplying the verified material_id through the library workflow. |
| mode | Defaults to VOICE_OVER. Use SUBTITLE_ONLY with subtitles enabled to burn translated captions over the source audio. |
| auto_translate | Explicit boolean required by client; true for automatic output, false for manual review (service default false) |
| source_language / target_language | At most 32 characters; service defaults auto / zh-CN. Always set the user's requested language explicitly |
| task_name / translation_style | At most 200 / 64 characters; service defaults describe video translation / natural conversational style |
| default_speed | Finite 0.5-3.0, service default 1.0; client rejects out-of-range values rather than silently clamping |
| subtitle_enabled | Default true; burn in target-language subtitles |
| lip_sync_enabled / remove_subtitles_enabled | Default false; enable only as needed |
| align_original_subtitle_position | Default false; requires source-subtitle removal and enabled target subtitles |
| translate_and_align_original_title | Default false; requires source-subtitle removal and an existing enabled template title slot; target body subtitles may be disabled |
| persona_mode | voice-only (default) or with-avatar; lip_sync_enabled still controls lip sync |
| business_id / default_digital_human_id | Existing project/avatar IDs; positive signed long |
| default_prompt | At most 10000 characters |
| default_voice | Optional object or null; omit/null preserves the original flow. Set only for explicitly requested replacement after explaining its scope |
| settings | Use only documented extension keys; direct fields win. No template contents or selection fields here |
| template_type | 0 ordinary packaging, 1 dynamic subtitles. Omit when no template is chosen. |
| template_configs | Ordinary template candidates, each with template_id only |
| subtitle_template_configs | Dynamic subtitle candidates, each with subtitle_template_id only |

Use canonical fields from describe, not aliases, embedded task_id, or retired subtitle_template_ids. Offline validation does not prove account access, target-language support, or media reachability/encoding.

Each source_video may supply real file_name, file_size (bytes), file_type, mime_type, upload_time, duration (seconds), width, height, frame_rate, video_codec, audio_codec, container_format. Omit unavailable metadata; do not insert zero placeholders.

Items may include digital_human_id, prompt (up to 10000 characters), and settings. Omitted target_languages inherits the parent language; if supplied it contains 1-16 nonempty language codes, each up to 32 characters. Items can override subtitle_enabled, lip_sync_enabled, remove_subtitles_enabled, and template selection fields. Empty/omitted templates follow service inheritance; an empty array does not establish that a parent template was cleared.

Both alignment switches also support video-level overrides: explicit false overrides the parent and omission inherits. Verify an actual enabled title slot rather than inventing one. Video items can override the template type and candidates.

Set a unique `client_item_id` on each item when identifying sources in the batch. Each subtitle or cover file object requires its actual `url`.

| Item field | Purpose |
| --- | --- |
| `source_subtitle_file` | Source-language SRT reference |
| `subtitle_files_by_language` | SRT files keyed by target language. Each overrides the generated subtitles for that language. |
| `default_cover_file` | Default cover for this video |
| `cover_files_by_language` | Cover files keyed by target language. Each takes precedence over the video default. |

Use files accessible to the current workspace. For local attachments, obtain their actual URLs through [media upload](upload_info.md). Enable subtitles when providing an SRT and check its timestamps against the source duration. Cover fallback is per-language cover, then video default, then source frame.

voice_over_clips is an object array with from/to (seconds), text, audio_url, speed, keep_original_voice, lip_sync, lip_sync_video_url. Use only for requested preset clips with real inputs; it is not a voice-cloning or arbitrary voice-selection API.

## Voice selection at creation

Preserve original voices by default, as in the example. Apply [voice intent and scope](../capabilities/processing/video-translation.md#voice-intent-and-scope) before adding this parent-level create field:

```json
{ "default_voice": { "reference_audio_url": "https://example.com/reference.mp3" } }
```

It applies to ALL videos and target languages in this batch. Every speaker without a dedicated mapping uses this same voice; it does not select a detected person or sentence. Only reference_audio_url is supported, not audio_id or speaker_id. Never place it in settings, items or video settings. A non-null object must contain only that URL. The service trims surrounding whitespace; HTTP(S) URL paths must end in .mp3, case-insensitively, and may carry complete signed query parameters. Empty objects, blank URLs and non-MP3 paths are rejected.

Prepare local reference audio as an actual MP3 when needed and use [generic upload](upload_info.md) for its object_url before creation. Do not create an unnecessary translation task just to obtain the task-scoped audio-upload signature. Existing voice asset audio_id belongs only in operations accepting speaker mappings. The reference URL must remain valid through first dubbing and later retries.

Priority: dedicated speaker mapping, then default_voice, then the segment's original voice. This default is create-only; update_speaker_voices cannot modify or clear it. Clearing dedicated mappings falls back to this default when present. The creation contract documents parent/item query echoes; the client tolerates older responses without the field and retains only public reference_audio_url.

## Templates and integer precision

Use template_type=0 and template_configs for ordinary packaging, with at most 100 candidates containing only a positive template_id. For dynamic subtitles use template_type=1 with subtitle_template_configs, each containing only a positive subtitle_template_id. Template-editing fields such as background, watermark and cover are rejected. Changing templates after submission needs a new task and must not silently incur another charge.

When the ID is missing, use [translation template selection](../resources/packaging-templates.md#translation-template-selection) to query `mixed_cut` / `video-editor`, include the account's visible scopes, paginate as needed, and inspect actual details. Query a supplied real ID directly. The list query's string template_type is not this operation's numeric template_type.

Supply large IDs as decimal strings, e.g. "2100065567327711232" (example only). The client preserves precision and sends exact JSON integer tokens for long fields. It also preserves large numeric tokens in input files. Do not round them in another parser.

Dry-run body keeps large IDs as safe display strings; body_json contains exact wire serialization. Do not re-encode the display object to replace the client request.

## Results and review

Public results also expose speaker_voice_mappings, resynthesis_by_language and per-language delivered media, voice_over_clips, subtitle_asr_sentences and translated_segments_snapshot. Current drafts can differ from old deliveries. from/to are seconds; subtitle begin_time/end_time are milliseconds. voice_reference_audio_url is the original voice reference, not a newly bound voice. Internal snapshots, vendor checkpoints and audio fingerprints are excluded from projected output.

For existing-video speech corrections, use [segment retries and language rendering](translation-revision.md) to reuse visuals and valid unaffected speech. Resume the operation journal to verify its exact business receipt; a plain parent status or old URL does not verify a new render.

Query the original ID every 5-10 seconds, with 50-second waits by default. Creation is not automatically retried. Progress counts both successful and failed items; 100% does not mean all succeeded.

Decode `task_result.result`. For an ordinary video, prefer `results_by_language[language].output_video_url`, with the item's `output_video_url` as the fallback when there is no language map. A video item with `split_part` is a section of the original. Wait for `split_outputs[group_id][language].status` to reach `COMPLETED` and deliver that complete `output_video_url`.

Read `rendering_warning_code` and `rendering_warning_message`, prioritizing the language result. `NO_SUBTITLE_VERSION_UNAVAILABLE` means the subtitled version is available. `SUBTITLED_VERSION_UNAVAILABLE` means the subtitle-free version is available. Use the returned `output_video_url` and report the missing version.

FAILED/INSUFFICIENT_POINTS parents retain successful videos. Partial success exits 5; no deliverable/all failed exits 1. Journals keep source-URL hashes and expected languages, not raw URLs, translations, or keys. Resume checks coverage. Direct status lacks original expectations; ambiguous/duplicate sources may produce requested_languages_checked=false, requiring comparison to the original request.

Manual mode returns the required review context rather than blindly polling for human approval. Review phases/details become review when returned by the task query. Allowed fields include phase, languages, video items, sub_task_id, child status, source URLs, ASR, translations, storyboards, and errors. review_visibility=available means actual details were returned; unavailable means query later or obtain review context. It does not mean review passed.

Use [translation review](../capabilities/processing/video-translation.md), [edit](update_translation.md), and [approve](confirm_translation.md). Invalid JSON is a protocol error, not something to silently repair into success. Inspect final language, media availability, and quality.

[Result reference](https://vibbit.apifox.cn/515706553e0).

## Recovering a source-duration probe failure

When the service reports that it cannot obtain the audio-separation source-video duration, the CLI adds source_video_recovery to the error or failed result while retaining the original error, task and journal. It does not automatically resubmit or redo a batch. The issue has been observed with a generated permanent URL; that does not establish that all permanent URLs fail. Server-side probing compatibility remains a business-backend issue.

First query the original task and establish an explicit failure. Resolve uncertain acceptance or a running task and preserve any successful results. Download the same affected source once into a private local file and probe its video/audio streams and duration. Create upload-request.json containing {"is_temporary":true}, then run:

```bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" probe --file /absolute/task/source.mp4
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" upload_info --file /absolute/task/source.mp4 --input /absolute/task/upload-request.json
```

Use only the actual uploaded object_url for the affected item's source_video.url; do not rewrite a perm hostname or path into temp. Preserve languages, voices, subtitles and other settings. After the old task is confirmed failed and the replacement is within the authorized scope, use a new submission ID for the new task and retain the old journal and successful media. Upload credentials alone do not prove upload completion. Reuploading is a reported workaround, not a universal repair for damaged or silent media.
