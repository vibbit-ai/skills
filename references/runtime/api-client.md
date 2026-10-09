# Vibbit API client

Read before the first API call, followed by the selected capability's API reference. Planning and local rendering need no API calls; external engines have separate runtime requirements.

The client and read-only environment checker use Node.js 18+ with no npm dependencies. `$VIBBIT_SKILL_DIR` is the absolute directory containing the installed `SKILL.md`, not the project directory. Set it to the real installation path or expand it in commands.

Use `auth_status` to check and reuse [authentication](authentication.md) before network operations. If setup needs user action, preserve progress and provide a real entry using [account continuation](account-continuation.md). Dry runs need no key. Never put keys in command arguments, request files, the skill, or task records. For avatar covers/images use [image previews](media-preview.md); `preview_url --url IMAGE_URL` converts eligible URLs offline.

Select the account site independently using [authentication](authentication.md). `--region cn|global` scopes a single call; `--site` supplies a website hint for an unconfigured user. Language never changes the API destination.

~~~bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" describe --command seedance
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" seedance --input /absolute/path/request.json --dry-run
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" seedance --input /absolute/path/request.json
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" resume --state /absolute/path/returned-journal.json
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" resume --submission-id ORIGINAL_LOCAL_ID
~~~

Write normal JSON to a file and let the client encode it. Do not manually escape nested JSON. Preserve explicit choices and use the operation's API/model guide. Describe/dry-run validate structure, not live availability or quality.

Asynchronous submission normally returns an ID immediately. Save it and the journal path. Each wait defaults to 50 seconds; continue the same record under [task lifecycle](task-lifecycle.md). A wait timeout is not task failure.

The client persists submission_id before transmission. Choose a stable operation ID with --submission-id or a custom journal path with --state, never both. Reusing the same ID/journal only queries a recorded task; conflicting requests are rejected. This is local deduplication and recovery, not a transmitted server idempotency field. See [task lifecycle](task-lifecycle.md).

Do not repeat POST/PUT automatically after uncertain responses. Retain submission_id and the journal. Resume existing task IDs; without a server ID, investigate the original operation rather than changing the local ID to create another task. Manual translation review requires a query returning `review_visibility=available` and `review` before editing/confirming; follow [video translation](../capabilities/processing/video-translation.md).
