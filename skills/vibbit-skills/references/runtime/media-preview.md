# Image previews

Use for avatar covers, generated images, or existing images. Conversion is local and submits no generation task.

The client adds `artifacts[].preview_url` where possible. Avatar lists expose `previews[]` with resource_id, name when available, original url, and preview_url. These are presentation fields; preserve original results, IDs, and generation inputs.

- Convert `https://willing-video-test.oss-cn-shanghai.aliyuncs.com/` to `https://media.vibbit.cn/`, preserving path/fragment.
- Match only that complete HTTPS origin. Other hosts, buckets, ports, or embedded credentials are unchanged.
- Keep any query-bearing URL unchanged, including signed URLs. Do not strip parameters.
- Reuse media.vibbit.cn URLs. Conversion does not prove availability or host preview support.

~~~bash
node "$VIBBIT_SKILL_DIR/scripts/vibbit.js" preview_url --url 'https://willing-video-test.oss-cn-shanghai.aliyuncs.com/agentcy/cover/example.jpg'
~~~

The filename is a placeholder; use an actual returned URL. The command needs no key/network.

Prefer preview_url for thumbnails and names; fall back to original URLs. If inline display is unavailable, use an available browser gallery or usable link. A failed preview does not mean an avatar is absent and must not trigger regeneration. Keep its name, ID, and original link. Display candidates before waiting when the user requests selection.
