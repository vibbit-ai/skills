# Dynamic subtitle templates

Video translation accepts a verified Vibbit dynamic subtitle template ID on the task or an individual video. Enable subtitles, set `template_type=1`, and provide `subtitle_template_configs`. The ID below illustrates the format.

```json
{"subtitle_enabled":true,"template_type":1,"subtitle_template_configs":[{"subtitle_template_id":"2100065567327711232"}]}
```

Each level accepts up to 100 candidates containing only a positive integer `subtitle_template_id`. Use decimal strings for large IDs in the local JSON. The CLI sends exact integers. Empty or omitted video-level settings inherit the task configuration. Supply new candidates when changing the type. Ordinary packaging uses `template_type=0` and `template_configs`.

The public template list documents ordinary packaging. Use an existing verified dynamic subtitle ID or ask for the ID of the chosen template. Dynamic parameters apply to [video translation](../api/translate_video.md). Follow the individual contracts for composition and transcription.
