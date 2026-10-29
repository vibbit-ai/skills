# Query a material import: get_material_import

[API reference](https://vibbit.apifox.cn/526977708e0): GET `/openapi/v1/material-import-tasks/{taskId}`. This is read-only and never creates another task. Input:

```json
{"import_task_id": "2100065567327711232"}
```

Use the actual returned import ID, not this example. No request body or mandatory task- prefix is used.

```bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" get_material_import --input /absolute/path/import-task.json
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" get_material_import --input /absolute/path/import-task.json --wait
```

Omit --wait for one query. --wait polls import completion in 50-second windows, at least 5 seconds apart. Continue the original task or resume its original import journal after a window expires, following [task lifecycle](../runtime/task-lifecycle.md) without repeated continuation confirmation. --state and --submission-id do not apply to this read-only command; use resume for an existing journal.

| import_status | Meaning |
| --- | --- |
| PENDING / RUNNING | Queued or importing |
| SUCCESS | All imported; CLI status is COMPLETED |
| PARTIAL_SUCCESS | Some imported; CLI status is COMPLETED, partial_failure=true and exit code 5 |
| FAILED | All failed; CLI ok=false and status=FAILED, preserving item failures |

result.items contains index, source_url, status, available material_id/name/analysis_status, warnings and failure details. WAITING_PERMIT means waiting for processing capacity, not proven insufficient credits. Accept unfamiliar failure codes and show actual failure_reason.

--wait waits for import completion only. If auto_ingest=true and downstream work needs analysis, continue read-only queries of each item's analysis_status. Only COMPLETED with actual analysis content supports content retrieval. Stop on FAILED/CANCELLED. With auto_ingest=false do not wait for analysis to start by itself. Report imported and analyzing separately; never create a second import just because analysis is pending.
