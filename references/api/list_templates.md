# Packaging templates: list_templates

Task type: `VIDEO_PACKING_TEMPLATE_LIST`. Mode: `sync`; actual behavior and account access depend on the response.

[API reference](https://vibbit.apifox.cn/513300738e0)

Query the list directly and use returned detail; template application must match the destination operation.

## Inputs

Client fields and minimum requirements follow; the server may impose additional checks.

| Field | Type | Required | Usage |
| --- | --- | --- | --- |
| `business_type` | string | No | Exact business category; use `mixed_cut` for ordinary packaging matching the current translation page; omit to search all categories |
| `template_type` | string | No | Exact template type; video editor templates use `video-editor` |
| `scope` | string | No | `common` public, `tenant` team shared, or `private` current user's personal templates; omission includes all visible scopes |
| `keyword` | text | No | Fuzzy template-name search; omission or an empty string leaves names unfiltered |
| `page` | integer | No | Request pages start at 1; default 1 |
| `size` | integer | No | Default 10; 1–100 items per page |

Query ordinary translation packaging templates visible to the current account:

~~~json
{
  "business_type": "mixed_cut",
  "template_type": "video-editor",
  "page": 1,
  "size": 100
}
~~~

Omit `scope` unless the user restricts it, so team and personal templates remain discoverable. Do not send the undefined value `scope: "all"`. `scrolling_subtitle` is a separate business category, not the default for ordinary translation packaging. Use the relevant actual category for other workflows; do not force `mixed_cut` onto every template query.

The raw API returns a JSON-encoded string at `data.task_result.result`. The CLI already decodes it into its output `result` object; read `result.content`, `result.totalElements`, and `result.totalPages` directly without parsing the object again. Follow `totalPages` when listing all templates or building a complete candidate set; the first page is not the whole library. An unparseable response is an error, not evidence of zero templates.

If a user-named template is missing from this category, omit `business_type` while retaining `template_type: "video-editor"` and the name filter to search all visible categories. Check the actual configuration against the destination operation. See [translation template selection](../resources/packaging-templates.md#translation-template-selection) for selection and application.

## Call

~~~bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" list_templates --input /absolute/path/request.json --dry-run
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" list_templates --input /absolute/path/request.json
~~~

The client uses `input_info.input = JSON.stringify(input)` inside the input_info object. Do not change encoding and automatically resubmit after an error.

Use returned detail directly; when only an ID or incomplete detail is available, query [get_template](get_template.md).

[Authentication](../runtime/authentication.md) · [Task lifecycle](../runtime/task-lifecycle.md) · [Troubleshooting](../runtime/troubleshooting.md)
