# Interactive digital-human selection

This `vibbit` plugin bundles the production picker MCP at `https://mcp.vibbit.cn/mcp`. The MCP displays candidates supplied by this Skill; the existing OpenAPI client queries the selected account and produces media. Never send an API key, credential file, or full account response to the MCP.

## Query and show the picker

Follow [authentication](authentication.md) for an actual account query. Preserve the selected China or international site; the display server does not choose the business API site. Create a task directory outside the installed Skill, then run:

```bash
node "$VIBBIT_SKILL_DIR/scripts/avatar-picker.js" query --state /absolute/task/avatar-picker.json --region cn
```

Use `--region global` for an explicitly selected international account, or omit `--region` to preserve the configured selection. Never copy production credentials to a demo environment.

On success, discover the tool whose name ends in `vibbit_show_avatar_picker`, allowing the host's namespace prefix. Pass the returned `arguments` object unchanged. It contains `schemaVersion`, `pickerId`, and every returned candidate with its exact string ID, display name, and usable cover URL. Keep `state_file` local. Missing names receive an explicit unnamed label; long display names are shortened to the UI limit, while the original records remain in the snapshot.

Briefly invite the user to select and confirm in the card. Wait for the actual selection callback or context message; do not choose a default or treat successful card display as a selection. If the host supplies the callback only as context, a user message such as “continue” can resume processing.

## Resolve the selected ID

Use both values returned by the current card:

```bash
node "$VIBBIT_SKILL_DIR/scripts/avatar-picker.js" resolve --state /absolute/task/avatar-picker.json --picker-id RETURNED_PICKER_UUID --id EXACT_RETURNED_ID --region cn
```

Use the same account selection as the query. The resolver checks the snapshot, account binding and membership, then returns `digital_human_id` and the original record. Display numbers, names, previews and material IDs never replace the API ID. Continue only the production steps already requested by the user, through [digital-human resources](../resources/digital-humans.md) and the original workflow. A card-only test ends with reporting the selection.

## Availability and fallback

The complete plugin installs the MCP declaration; users do not need to paste its URL or add another connection. The installer attempts to reload the existing runtime and can normally restart the desktop with the explicit `--restart` option. Read its receipts: installed files, a reload request, a restarted process, and a usable tool are different results. Verify the tool in the next conversation. If refresh is pending, use the installer recovery command after active tasks finish. Follow an actual host trust or connection prompt when one appears; installation does not prove trust, runtime connectivity, card rendering, or callback delivery.

If the tool is missing, inspect the available plugin/MCP error and report the actual condition. If a query fails, follow that error instead of creating demo candidates. If UI rendering is unavailable, or the user requests text, present the complete real list according to the resource guide. More than 200 candidates or a 512 KiB tool payload uses the saved complete snapshot as a text/file fallback; do not silently truncate it. A shell request or standalone browser page does not prove an embedded card works.

Only for an explicitly requested UI-only demo, fictional labelled candidates may be passed directly to the MCP without account credentials. Confirm that selection against those demo items, skip the account resolver, and never use demo IDs for business API calls.
