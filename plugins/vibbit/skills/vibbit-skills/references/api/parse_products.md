# Parse product links: parse_products

Task type: `ECOM_PRODUCT_PARSE_LINKS`. [Public API](https://vibbit.apifox.cn/519694921e0)

## Input

These are accepted client fields and minimum requirements; the server may validate actual data further. Unknown fields and null values are not silently discarded.

| Field | Type | Required by client |
| --- | --- | --- |
| `links` | urls | Yes |

Amazon `/dp/ASIN` and `/gp/product/ASIN` pages belong here; do not try `parse_url` first. Parsed product images may be low-resolution thumbnails, such as 254px images. Before Seedance generation, prefer an actual higher-resolution original and follow [reference checks](../runtime/media-inputs.md#seedance-25-product-reference-checks). Do not infer dimensions from URLs or rewrite CDN size markers to guess an original.

The client preserves result and adds item_summary (succeeded / failed / unknown). Partial success sets partial_failure=true; all-failed responses have ok=false. Unmatched items are not marked saved. Public documentation does not specify every partial-failure shape, count limit, or deduplication guarantee.

The URLs, product facts, and IDs below are placeholders; replace them with actual inputs.

```json
{
  "links": [
    "https://example.com/products/projector"
  ]
}
```

## Call and result

```bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" parse_products --input /absolute/path/product.json --dry-run
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" parse_products --input /absolute/path/product.json
```

POST /openapi/v1/tasks with input_info.input as a native object, not a JSON-encoded string. Public examples return data.request_id and data.task_result.result (a JSON string) synchronously. The client parses and preserves it. Do not invent polling/resume IDs when no task_id exists. Preserve uncertain write records and investigate the original operation rather than automatically issuing another POST.

links is a nonempty product URL array. Per-link results may include url, name, price, price_unit, image_url, image_urls, description, source_asin, third_product_id, third_product_url, platform, and status. Check each status and its facts. Parsing does not save products or assign platform product IDs. This differs from video share-link parsing.

[Product library and creative inputs](../resources/products.md) · [Task records and recovery](../runtime/task-lifecycle.md) · [Authentication](../runtime/authentication.md)
