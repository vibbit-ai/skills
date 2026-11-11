# Preview and select separated audio

Use only when the host actually exposes `vibbit_show_audio_tracks`. The Skill owns credentials, account queries and journals. This public MCP only displays completed tracks and receives no business Key. If unavailable, continue the original workflow with actual track names and usable files; do not configure a duplicate MCP.

```bash
node "$VIBBIT_SKILL_DIR/scripts/audio-tracks.js" prepare --journal /absolute/path/task.json --state /absolute/private/audio-picker.json
```

This performs GET on the original task and refreshes signed URLs. It requires the submitted model from that task journal. Resume the original task if still running. Pass returned `arguments` unchanged to the host tool ending in `vibbit_show_audio_tracks`; retain `state_file`. Users may listen, download and select multiple tracks. Preview and selection do not authorize new production.

Save an actual `audio_tracks.selected` event verbatim to a private JSON file outside the installed package (POSIX mode 600), then resolve it:

```bash
node "$VIBBIT_SKILL_DIR/scripts/audio-tracks.js" resolve --state /absolute/private/audio-picker.json --event /absolute/private/event.json
```

The adapter checks account/site binding, snapshot, task and exact track membership, recovering original URLs from the private snapshot. Never accept URLs, model numbers or labels from events. Continue only the already authorized workflow with actual selections. For expired links, prepare a new snapshot from the same task journal; old events cannot select tracks in the new card. Snapshots contain signed URLs: keep them outside the installed Skill and out of Git.
