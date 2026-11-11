# Webhook task notifications

[Official guide](https://vibbit.apifox.cn/9665490m0). Use for server orchestration, batch notifications and downstream task continuation when you have a reachable receiver. Ordinary local agents keep polling; installation and first-time account setup do not require a callback service.

## Configuration and scope

Configure the complete callback URL on the submitting API Key before creating tasks. Do not invent per-task callback fields. Enabling notifications later does not backfill older tasks. Supported task types cover ASR, image/audio generation, Seedance, subtitle removal, separation, breakdown, avatars, translation, content-link parsing and composition. Synchronous reads/TTS and material-import jobs are outside this contract.

`task.completed` is a terminal event, including COMPLETED, FAILED and INSUFFICIENT_POINTS. Translation review stages still require queries and the existing review/confirmation workflow; updates do not each guarantee a callback.

Delivery is best effort. Save task IDs and journals and retain polling as fallback. By default only terminal updates from approximately the last 30 seconds are covered, and tasks submitted over seven days earlier are no longer notified. Webhooks do not provide cancellation, submission idempotency or guaranteed background execution.

## Verification and optional receiver

Calculate HMAC-SHA256 using the submitting API Key over the original body bytes. Compare with lowercase hexadecimal `X-Webhook-Signature` in constant time, then validate the signed body timestamp in milliseconds (default tool tolerance: five minutes). The timestamp header alone is insufficient. Never parse and reserialize JSON before verification. Notifications have no key identifier: use separate receiving routes and explicit key mappings for multiple Keys.

`lib/webhook.js` exports `verifyWebhook`. The optional receiver reuses existing Skill credentials, binds only to 127.0.0.1 and is never started automatically:

```bash
node "$VIBBIT_SKILL_DIR/scripts/webhook-receiver.js" --dir /absolute/private/webhook-receipts --port 8787 --region cn
```

Expose its full `/webhook` route through your own HTTPS proxy/tunnel and configure it on that Key. The receipt directory must be private (POSIX 700). The tool caps bodies at 8 MiB, verifies, writes and syncs a private receipt keyed by payload digest, then acknowledges with HTTP 204. Storage failure returns 503. Identical payloads reuse receipts; changed payloads for the same task remain separate. It does not initiate generation, spending or chat messages. For production, reuse the verifier with your reliable storage/queue, proxy and service lifecycle management. Restart the receiver when switching credentials.

## Consume results

Notification `data` follows the task-query layout, including a JSON string at `task_result.result`. Failure result/error fields may be absent. Preserve actual composition job IDs and the submitted separation model. A callback is not a new submission.

Duplicates and out-of-order delivery are possible. Translation re-rendering may produce new results for the same task. Associate by task ID and deduplicate identical payload digests; do not permanently ignore all later notifications for a task. Query the latest task before replacing results on changed notifications, using the existing journal. The platform considers HTTP 2xx successful regardless of response JSON. Default retries: two, configurable 0–10. Acknowledge only after durable storage; process business work separately and query tasks if delivery/retries fail.
