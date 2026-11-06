# Existing works

There is no public work-library query or write command. Use the actual file, media URL, or task ID supplied in context. Identify the selected version explicitly rather than assuming the newest file is the approved one.

A generated revision is new media. Do not claim the platform's current work has changed without a successful supported save operation. Review and revise through [video review](../capabilities/analysis/video-review.md).

## Continue a project

If the original task ID is unknown, run `vibbit.js list_local_tasks --limit 20` from the original project directory. Optionally add `--command compose` and `--since 2026-11-01T00:00:00+08:00`. This lists local journals for the selected API environment, newest first. Use `resume --state` or `status --task-id` to retrieve the selected task and its actual output.
