# Audio separation: separate_audio

Separate an existing library audio/video material into reusable WAV stems. This is distinct from ASR and arbitrary speaker diarization; model 10 targets musical duets.

[Create](https://vibbit.apifox.cn/533904466e0) · [Query and model/stem table](https://vibbit.apifox.cn/533904556e0)

## Input and execution

```json
{"material_id":"2100065567327711232","model":2}
```

Replace the example ID with an actual material in the selected account. Keep material IDs as exact positive integer strings. `model` is an integer. POST `/tasks`, task type `AUDIO_SEPARATION_TASK`, with a native JSON object in `input_info.input`. Do not submit URLs, caller-supplied durations or invented output fields.

When omitted, this client explicitly sends model 2. The creation page still contains old 2–9-only and required/optional wording; this integration follows the expanded query-page table: 1–10 and 12–21, excluding 11. Preserve a model rejection; do not silently switch models and submit another paid task.

The source must be a current-workspace, non-deleted AUDIO or VIDEO library material. Before submitting, the client reads material detail and requires a server duration greater than zero and at most 1800 seconds. Missing/invalid duration prevents submission. Uploading to OSS does not register audio. The public external import operation supports videos; never send audio to it under a false media type. Import external videos through the existing workflow. For external audio without a public registration operation, reuse an existing audio material or explain the concrete missing capability.

```bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" separate_audio --input /absolute/path/input.json --dry-run
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" separate_audio --input /absolute/path/input.json --state /absolute/path/task.json --wait
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" resume --state /absolute/path/task.json
```

Retain the original journal, model and source material ID. Every accepted submission creates an independently billed task. Query at intervals of at least 10 seconds; limit account-wide concurrent separation jobs to five. RUNNING includes extraction, transfer and settlement, potentially several minutes. Never resubmit to check progress or refresh downloads. The documented price is 10 points per started minute; actual acceptance and billing are determined by the service.

## Models and results

| Model | Stems / purpose |
| --- | --- |
| 2–9 | Legacy `vocal_audio_url` and `background_audio_url`; default 2; algorithm preferences follow the official table |
| 1 | `vocals / drums / bass / guitar / piano / other` |
| 10 | Duet `male / female` |
| 12, 13 | `aspiration / other`: breathing/aspiration and the remainder |
| 14, 18 | `noreverb / reverb` |
| 15, 16 | `dry / other` |
| 17 | `dry / no dry` |
| 19 | `no drum-bass / drum-bass` |
| 20 | `kick / snare / toms / hh / ride / crash` |
| 21 | `vocals / instrumental`: backing vocals and the part without backing vocals |

Check task status before decoding the JSON string at `task_result.result`. Both result layouts normalize into `separation.tracks` and audio `artifacts` with exact stems. Preserve spaces and match by stem, never array order. `vocals` means main vocals for model 1 but backing vocals for model 21; retain the submitted model.

`resume` restores the model from the journal. With only a task ID, use `status --task-id ORIGINAL_ID --model 21`; this model is local result context and is not sent in GET. Without model context, multitrack results retain raw stems and request context rather than inventing labels.

Signed download URLs expire and are refreshed by querying the original task. Download needed files promptly and preserve source/track mapping. Separation output is not proof of library registration.

For listening and selection, use [audio tracks](../runtime/audio-tracks.md) when the host exposes the tool. Selected audio can feed ASR/captions, avatar video, replacement dubbing or an independent audio track. Follow [mixcut](../workflows/semantic-mixcut.md) for timing/gain validation, cloud composition and [Jianying drafts](../workflows/jianying-draft.md). Review sound quality separately from task success.
