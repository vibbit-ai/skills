# Media composition: compose

Task type: `MEDIA_PRODUCTION`. Mode: `async`; actual behavior and account access depend on the response.

[API reference](https://vibbit.apifox.cn/513300741e0)

Preserve track-field casing and use the documented composition configuration. Inspect the actual rendered result.

## Inputs

Client fields and minimum requirements follow; the server may impose additional checks.

| Field | Type | Required |
| --- | --- | --- |
| `packing_origin` | object | Yes |
| `video_packing_template` | object | Yes |

Replace example URLs/IDs with real accessible assets and resources before submitting.

~~~json
{
  "packing_origin": {
    "video_track_list": [
      {
        "MainTrack": true,
        "VideoTrackClips": [
          {
            "MediaURL": "https://example.com/source.mp4",
            "Type": "Video",
            "In": 0,
            "Out": 5
          }
        ]
      }
    ]
  },
  "video_packing_template": {
    "background": {
      "type": "color",
      "width": 1920,
      "height": 1080,
      "color": "#000000"
    },
    "video": {
      "x": 0,
      "y": 0,
      "width": 1,
      "height": 1,
      "adapt_mode": "Contain"
    }
  }
}
~~~

## Call

~~~bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" compose --input /absolute/path/request.json --dry-run
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" compose --input /absolute/path/request.json
~~~

The client uses `input_info.input = JSON.stringify(input)` inside the input_info object. Do not change encoding and automatically resubmit after an error.

Both packing_origin and video_packing_template must be objects. Preserve nested PascalCase, including MainTrack, VideoTrackClips, and MediaURL.

- `In` and `Out` are source trim points in seconds. `TimelineIn` and `TimelineOut` are positions in the final timeline. Set image display time with `Duration` and canvas size in pixels with `background.width` and `height`.
- Put separate audio in `packing_origin.audio_track_list[].AudioTrackClips`. Use the clip timeline for narration, music, and effects. Template `audio.original_volume` controls the overall source volume. Supply a single template BGM entry for a fixed music choice.
- Supply caption `Content`, `TimelineIn`, and `TimelineOut` in `packing_origin.subtitle_tracks[].SubtitleTrackClips`. Enable the corresponding style in `video_packing_template.subtitle_track_clips` with `type=subtitle` and `enabled=true`. Set `enable_keywords` explicitly.
- Use template settings for covers, end frames, and watermarks. Mark the main video track for cover and end-frame placement. A cover occupies 0.1 seconds. A still end frame accepts a duration.

Read the actual `video_url` once the original task completes. The CLI preserves `job_id` when the API returns it, including in the local continuation record. The public pages differ on when this ID is available. Check the actual receipt and desktop validation before attempting draft handoff. Use the official examples and rendered output to verify complex tracks.

[Editing contract](https://vibbit.apifox.cn/513300741e0) · [Composition and optional Job ID](https://vibbit.apifox.cn/532578560e0)

[Authentication](../runtime/authentication.md) · [Task lifecycle](../runtime/task-lifecycle.md) · [Troubleshooting](../runtime/troubleshooting.md)
