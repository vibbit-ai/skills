# Ecommerce ad production

Use this workflow for product ad kits, finding creative references, reference-led ads, combined images and video, or a job that needs configuration and stage previews. For deciding what to sell, use [product research](product-research.md). A specific, fully specified single [image](product-marketing-image.md) or [video](product-video.md) can use its direct workflow.

## 1. Confirm the product, brief, and scope

Read a product page with [parse_products](../api/parse_products.md), or reuse the [product library](../resources/products.md). Check the exact variant, original images, visible features, and supplied brand assets and language. Look for linked footage of this variant and explicitly requested templates first. Match any price, promotion, review, and performance claim to evidence for this item and market. Language, advertising market, and account region are separate choices.

Carry forward the requested deliverables, placement/ratio, counts, duration, variant, language, selling angle, narration, and music. Fill only gaps that change the output. Use the [settings card](../runtime/ad-studio.md) when a choice is needed. Prefill what the user has said and base recommendations on the actual product. Proceed on choices the user delegated. Research- or planning-only requests stop at that deliverable. Follow [product library rules](../resources/products.md) for saving, including an explicit Save action. Confirming settings records the brief for the current work.

## 2. Find references with evidence

Start with user-provided references and note what to borrow. Check whether linked footage shows the exact product and supports the planned demonstration. Search external sources when helpful, using the requested market and channel.

- **Public TikTok posts.** Use [search_tiktok](../api/search_tiktok.md) with a small set of product names, local terms, and demonstrable actions. A first pass can use 3–5 short queries. Deduplicate by video ID and rank the returned sample using available play, like, comment, save, or share counts. Omit missing metrics and label posts as public when ad status is unknown. Omit undocumented sort/date values instead of claiming a platform-wide ranking.
- **Meta competitor ads.** With a capable host browser, use the [Meta Ad Library](https://www.facebook.com/ads/library/) for the requested market, advertiser, or keyword, or analyze an accessible ad link from the user. Record the advertiser, observed creative, and visible status or start date only. Keep the source link separate from a playable media URL. If the source is unavailable, acknowledge it and continue with available sources. There is no current Vibbit Skill API for Meta competitor ads; an authorized advertiser report only covers its own account. Running duration does not establish spend or conversions.
- **Other sources.** Use [Google short videos](../api/search_videos.md) to fill discovery gaps and [reviews or discussions](../resources/external/reviews.md) when needed for customer objections. Respect an explicitly requested source and report missing coverage.

Prioritize exact item and useful demonstration, with play counts as a first-pass signal. Review a few strong candidates with [link parsing](../capabilities/analysis/content-url-parsing.md) or [video breakdown](../capabilities/analysis/video-breakdown.md) where needed. Give the user evidence for the useful candidates, mark title/thumbnail-only observations as unverified, and never claim to have watched unplayable footage. Offer another search, adding a link, selection, or skipping. Carry selected records into refreshed cards and keep research references distinct from cleared production inputs.

## 3. Choose the direction and produce

Use verified product details and adopted references to offer a few meaningfully different concepts when the user needs to choose. Include an opening, concrete beats, ending, why it fits, and any actual references. With an explicit direction or delegated selection, proceed directly. Use [reference adaptation](reference-remake.md) for what to retain and how to express it with this product. For Meta, reuse the [creative methods](../platforms/meta/index.md) as needed. Keep a single adopted brief and revision for stills and video.

Verify downstream inputs before submitting jobs. Mark adopted vs. alternate assets and preserve the task receipts. Stills, keyframes, voice, and music can run with bounded concurrency when independent. Reuse existing suitable assets.

Before submitting music or prompt-directed speech, follow [audio generation](../capabilities/generation/audio-generation.md) to check the target duration and any reference samples.

| Work | Existing Vibbit capability |
| --- | --- |
| Images | Use [gen_image](../api/gen_image.md) through [product image production](product-marketing-image.md) for still ads, scenes, detail visuals, or keyframes. Check variant, proportions, brand marks, packaging, and room for copy. Use controlled typesetting for verified copy, price, and CTA. |
| Music | Select an adopted track or use [generate_audio](../api/generate_audio.md) as a separate BGM task when the brief calls for new music. Capture the desired pacing and duration ceiling. Prefer instrumental for an ad without sung copy. Check actual length, trim, fade, and mix. Omit the music track when disabled. |
| Voice | Follow [voices](../resources/voices.md) and use the selected `voice_id` with `text_to_speech` for the adopted script. For prompt-directed speech in a reference style, [prepare the voice preview](../api/generate_audio.md#prepare-a-platform-voice-preview), then use its prepared URL and the current script with `generate_audio`. Generate clean speech when mixing narration and music as separate tracks. Reuse suitable recordings directly. Follow [transcript checks](../runtime/transcript-tools.md) for brand, numbers, timing, and captions. If too long, isolate the affected line. Use the adopted speech for [on-camera digital-human narration](oral-broadcast.md) only when requested or selected. |
| Video | Use [Seedance](../api/seedance.md) or approved footage of this exact item. A keyframe-dependent clip starts after the image check; lip sync waits for adopted speech. Respect [model constraints and 720p default](../capabilities/generation/video-generation.md). An unsupported delivery ratio such as 4:5 needs a real packaging/crop route that keeps the product and copy in frame. |
| Assembly | Follow [cloud production](hybrid-video.md) and [compose](../api/compose.md) for the adopted shots and independent voice, music, sound, and subtitle tracks. Use actual speech timing. Check for music already embedded in a source. Submit the adopted assets and real cut ranges. |

## 4. Preview, deliver, and revise

Use the [draft/final card](../runtime/ad-studio.md) for actual available media and real task progress. Update when new media is useful or the status meaningfully changes. Draft previews need no extra gate when the user already authorized full production. Verify the final asset using the [review workflow](../capabilities/analysis/video-review.md), including product consistency, actions, framing, speech, subtitles, and end card. Keep drafts, source links, task IDs, and final media distinct.

Record the brief, selected references/concept, adopted revisions, and task receipts in the [creative handoff](../contracts/creative-handoff.md). Resume the original [task](../runtime/task-lifecycle.md) after interruption. Replace BGM and recompose for a music edit; revise the affected speech, captions, and lip sync for a line change; repair an opening locally where possible; adapt framing using still-valid assets. Keep revisions. Use the [Jianying draft handoff](jianying-draft.md) only with a real exportable Job ID. Publication, ad delivery, and template saves follow the actual user request.
