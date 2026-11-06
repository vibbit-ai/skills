# Reference structures

## Cloud viral structures

- Run `vibbit.js list_viral_structures` to browse. Use `--input` with `{"page_no":1,"page_size":20}` to page through results, up to 50 at a time. Match names and categories locally. Keep a tenant structure `id` distinct from a platform `formula_id`.
- To save a reference video as a cloud structure, run `vibbit.js analyze_viral_structure --input /absolute/path/formula.json --submission-id <unique-submission-id>`. Example input is `{"video_url":"https://example.com/source.mp4","name":"Unboxing","request_idempotency_key":"unboxing-001"}`. Optional metadata includes a cover, category, tags, scene, and notes. Use a unique idempotency key per new analysis and keep the input, returned `structure_id`, and journal.
- Run `resume --submission-id <original-id>` to check the same structure through the list, or use `--wait` on submission. Match the structure `id` and check its state. New items can shift pages. Automatic recovery scans a bounded set of pages, so continue browsing if needed. For analysis without saving, use [video breakdown](../capabilities/analysis/video-breakdown.md).

[List structures](https://vibbit.apifox.cn/532559807e0) · [Create and analyze](https://vibbit.apifox.cn/533444686e0)

## Private production templates

Use [Agent semantic mixcut](../workflows/semantic-mixcut.md) to analyze and save reference editing patterns: content structure, shot transitions, and speech timing combine with actual observation to inform Agent-derived rules. Store them in private script_template payload.editing, pin a revision, and retime new sound on reuse. This is not a cloud packaging-template ID.

For saving or selecting reusable scripts, use the [creative library](../workflows/creative-library.md) in user-private persistent storage. Pin revisions and retain source evidence and actual observation coverage for new templates extracted from videos.

Reuse expressive relationships while grounding the replacement content in real facts. A successful reference does not guarantee future views or conversion. See [reference remake](../workflows/reference-remake.md).
