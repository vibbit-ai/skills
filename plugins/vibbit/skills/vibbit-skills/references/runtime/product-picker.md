# Interactive product selection

Use this picker to browse the current business account's product library and optionally choose reference images. Reuse a product already selected by exact ID directly; do not force another card. Product facts, AI profiles and creative proposals remain separate. The public MCP displays only the supplied data and never receives business credentials.

## Query and show

Create a task directory outside the installed Skill. Optional input is the existing `list_products` JSON: keyword, page (starting at **0**) and size. The picker defaults to 12 products and supports sizes 1–50.

```bash
node "$VIBBIT_SKILL_DIR/scripts/product-picker.js" query --state /absolute/task/product-page-1.json --input /absolute/task/product-filters.json --max-images 5 --region cn
```

Omit `--input` for the first page. Keep the actual account selection: use global when explicitly chosen or omit region to preserve the configured site. `--max-images` is the reference-image selection limit (1–40, default 8); choose it from the actual workflow/model constraints. This does not set production quantity or authorize generation.

On completed success, discover the host tool ending in `vibbit_show_product_picker` and pass returned `arguments` unchanged. Keep state_file, raw records and request journals local. Briefly invite selection and wait for a real event. Cards show actual names, cover previews, source and price; missing images or prices are not invented. Available image counts are not linked-material counts.

## Product detail and reference images

For a `product.inspect` event, save the exact JSON and use the current snapshot:

```bash
node "$VIBBIT_SKILL_DIR/scripts/product-picker.js" inspect --state /absolute/task/product-page-1.json --event /absolute/task/product-inspect.json --new-state /absolute/task/product-detail-1.json --region cn
```

The adapter verifies membership and account binding, queries only the chosen product using `get_product`, and creates a new snapshot/pickerId. Pass its returned arguments to the same MCP tool. The detail view opens with actual descriptions, selling points and selectable images. Showing detail or previewing an image is not selection; reference images are chosen explicitly. Image IDs are local picker identities, not platform material IDs.

The visible description and selling points may be shortened to UI limits. Complete records remain private; use the resolved full product record for production. Do not turn profile suggestions into verified claims. Editing, deleting, importing or generating products is outside this selector's operation.

## Select and continue

Save the exact `product.selected` event (schemaVersion, type, pickerId, exact product id, imageIds). Always resolve against the **latest displayed** snapshot:

```bash
node "$VIBBIT_SKILL_DIR/scripts/product-picker.js" resolve --state /absolute/task/product-detail-1.json --event /absolute/task/product-selection.json --region cn
```

Resolution checks the current product, account, image ownership and selection limit, then reads fresh detail. Continue the already authorized task using returned product_id, record and reference_images[].url. Empty imageIds means the user chose the product without explicitly choosing reference pictures; preserve that distinction. Only original product URLs go to downstream APIs, not card indexes, local image IDs or thumbnail guesses. If selected image URLs changed, refresh details and let the user choose again rather than substituting another variation.

## Search, pagination and pending queries

For `product.browse`, save its exact query and make a new snapshot:

```bash
node "$VIBBIT_SKILL_DIR/scripts/product-picker.js" browse --state /absolute/task/product-page-1.json --event /absolute/task/product-browse.json --new-state /absolute/task/product-page-2.json --region cn
```

The visible page number is API page + 1; do not increment event page again. Browse and inspect events do not select a product. Original snapshots are never overwritten by a new page.

Product queries use existing read operations carried by POST /tasks. The adapter records a private operation before submission and preserves the original CLI journal. If a query is pending or its delivery is uncertain, **never rerun query/inspect/resolve to recover it**. Use the returned product_picker_state:

```bash
node "$VIBBIT_SKILL_DIR/scripts/product-picker.js" resume --state /absolute/task/RETURNED_PRODUCT_PICKER_STATE.json --region cn
```

Resume uses the original `vibbit.js resume` GET-only recovery, with no new submission. A completed picker or resolution returns its saved result without another API call. Missing backend task identity remains an actual recovery error; do not invent one. Account changes invalidate the snapshot.

## Availability

This component requires the matching MCP service build and this adapter in the installed Skill. Missing tools, host refresh/trust or rendering failures follow the actual plugin/MCP condition; use the existing complete real [product workflow](../resources/products.md) as text/file fallback when necessary. Do not add a duplicate connection or create fictional products to work around failed queries.

Limits are 50 products, 40 detail images and 512 KiB of tool arguments. Oversized or malformed responses keep their original private result for fallback; they are not silently converted into fake pagination or truncated product candidates. Fictional UI demos are explicitly labelled and never used for business API calls.
