# Packaging template details: get_template

[Public API](https://vibbit.apifox.cn/513300739e0). VIDEO_PACKING_TEMPLATE_DETAIL queries an existing template by its real template_id. It is read-only and does not create or edit templates.

```json
{ "template_id": "2100065567327711232" }
```

```bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" get_template --input /absolute/path/template.json --dry-run
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" get_template --input /absolute/path/template.json
```

POST /openapi/v1/tasks uses JSON-text input_info.input. The CLI preserves large template IDs as exact integer tokens. Do not pass names, list positions, pagination or editing fields. Check business code, returned identity and actual detail; response completion follows the real result.

Use an ID from the [list](list_templates.md) or the user's actual resource. Query missing detail directly without requiring another selection. Apply it through the target operation's contract, such as ordinary template_configs in [translation](translate_video.md). A query result does not enable unsupported applications or dynamic subtitle workflows.
