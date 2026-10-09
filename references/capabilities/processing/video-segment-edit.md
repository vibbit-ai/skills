# Video editing and extension

Distinguish generative editing, continuation, and precise replacement of a selected platform-project clip. The first two use public Seedance 2.5; project selection/version writeback is not publicly defined.

For person, product, or scene replacement, use [1:1 remake](../../workflows/one-to-one-remake.md). Skip repeated selection when inputs are already clear, but still follow its audio and splitting rules: submit real silent video for unchanged dialogue/BGM and restore the original audio afterward; preserve audible source video for audio changes; split videos over 30 seconds into separate 4–30-second edits and then assemble. Continue subsequent language changes through that workflow using the adopted visual version.

Follow [2.5 editing/extension](../../models/seedance-2.5/editing-and-extension.md) and [Seedance API](../../api/seedance.md). For edit, supply the original video and explicit changes while respecting ratio/duration constraints. For extend, define direction, new content, and added-versus-total duration. Inspect whether the actual output includes the original; do not fabricate combined URLs.

Prompted second ranges remain generative guidance, not frame-accurate project editing. Without a supported project/work save contract, deliver new media or a plan and do not claim platform writeback or lossless preservation.
