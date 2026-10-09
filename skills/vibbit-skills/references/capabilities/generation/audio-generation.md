# Audio generation

Use [generate_audio](../../api/generate_audio.md) for speech, music, effects, or a requested mixture. For speech, establish the exact script, language, voice character, emotion, pace, and meaningful pauses. For music, specify mood, style, instrumentation, tempo, duration, and vocals. For effects, describe the source, action, distance, and spatial change. For mixtures, distinguish foreground sound, timing, and relative levels.

## Default for new digital human narration

When creating digital human narration from a script, generate speech, continuous background music, and restrained effects together in one task. Effects should support meaningful moments, not every sentence. Explicit requests for speech only, separate stems, or preserving existing audio take precedence. Other audio tasks use their own requested sound design.

Structure `text_prompt` around:

> Goal: state the exact script, language, voice, delivery, and pace. With a real reference, describe the voice characteristics to borrow from @音频1 while using the new script.
>
> Global sound rules: clear foreground speech, continuous low-level instrumental music, then brief effects. Start music with the opening, keep it continuous through speech, and fade it after the final line. Effects must not interrupt or restart the music.
>
> Script: separate each passage's delivery instructions, exact spoken words in braces, and any purposeful effect at the end of the line. Speak only the dialogue, never labels or production directions.
>
> Ending: add no extra dialogue; leave an appropriate musical finish.

Adapt style to the actual subject and speaker; an example entrepreneur's tone is not a universal persona. Keep spoken words separate from direction. Timing cues express intent, not measured alignment. One combined output is mixed audio, not independently editable speech/music/effect stems; precise effect placement still needs checking. Separate tracks require separate production when actually requested.

## Real audio references

Use up to three real material IDs in `reference_material_ids`, in their declared order. The service's literal reference tokens are `@音频1`, `@音频2`, and `@音频3`; these protocol tokens are not translated. Replace a generic file mention with its actual indexed token, or remove it when no reference is supplied. Do not force three references. Each reference is at most 30 seconds and 10 MiB and uses MP3, WAV, PCM, or OGG/Opus. These are reference limits, not output duration limits. Referencing a voice does not create a voice asset, and ordinary speech does not require a voice ID.

`upload_info --file` returns an `object_url` usable for directly driving an avatar, not a material-library ID. A local reference or URL still needs a supported registration path before reference generation. Preserve the reference and explain the missing step; do not substitute a URL for an ID, silently omit the reference, or guess private endpoints. See [audio API](../../api/generate_audio.md) and [voices](../../resources/voices.md).

## Generate, check, and continue

Check prompt length and duration parameters against the [API](../../api/generate_audio.md) before submission. Establish support for the required length of a long script instead of truncating it or sending out-of-range parameters. One unexpectedly long result is not a reliable duration guarantee. If segmentation is needed, preserve voice, wording, and continuous music design and establish the actual generation/assembly capability.

Save the task ID and query the original task. Check actual duration/format and, when listening is available, pronunciation, omissions/additions, voice consistency, and mixing. Pay attention to numbers, foreign words, names, and flagged passages. ASR errors identify questions, not confirmed audio defects; listen before distinguishing recognition errors from generation errors. A second ASR result is not listening evidence. Reuse one applicable check per audio version and state anything unverified; use [existing transcription](../analysis/speech-transcription.md).

Adopt the audio before submitting an avatar job, resolving known speech defects first. Reuse the returned URL directly without downloading and uploading it again. Preserve the chosen mixed or speech-only design and check actual lip sync after generation. Reuse adopted audio for postproduction revisions.

When captions or speech checks are needed, use [transcript tools](../../runtime/transcript-tools.md) to preserve one adopted-audio record, export captions, or compare speech. Reuse an applicable saved result and listen before choosing a correction scope.
