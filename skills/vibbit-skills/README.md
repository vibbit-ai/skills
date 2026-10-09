# Vibbit Skills

[中文说明](README.zh-CN.md)

Turn product links, ideas, scripts, references, and existing assets into ecommerce images, advertising videos, talking-head videos, short dramas, translated videos, and other creative content with Vibbit. Includes product-library management, research, planning, media generation, audio/video transcription, subtitle files, speech checks, review, and revisions.

## Install

```bash
npx skills add vibbit-ai/skills
```

Version **2.16.1** is one Skill for both official sites. Conversation language follows you; the content language follows your brief. A new installation from GitHub or a terminal defaults to the international site, while an existing configuration keeps its site.

## Connect your account

Ask your assistant to configure Vibbit. On a supported local computer it opens a private setup page; choose your usual site, create a key on that site's page, paste it into the form, and verify. Do not paste keys into chat.

- [International API Keys](https://app.vibbit.ai/api-keys)
- [China API Keys](https://app.vibbit.cn/api-keys)

The two sites have separate accounts, keys, credits, products, and assets. Website installation instructions carry the corresponding site. From the international website, copy this prompt:

> Install `npx skills add vibbit-ai/skills`, then configure my Vibbit account using https://app.vibbit.ai/api-keys. Carry this website as the setup source; reuse any previously configured site.

The China website uses https://app.vibbit.cn/api-keys in the same prompt. Advanced host environments can set `VIBBIT_REGION=cn` or `VIBBIT_REGION=global` alongside their secret key. Local setup instructions and site switching are in [authentication](references/runtime/authentication.md).

## Updates

Before the first actual Vibbit operation in each conversation, the assistant attempts one scoped update of this Skill. Failures fall back to the usable local version. Set `VIBBIT_AUTO_UPDATE=0` to disable automatic updates, or ask your assistant to skip them. Manual updates use:

```bash
npx --yes skills@latest update vibbit-skills -y
```

Updates require an installation tracked by the `skills` installer. ZIP/manual installations need a one-time migration through the installation command. Account credentials remain outside the Skill. See [update behavior](references/runtime/skill-updates.md).

## Audio, captions, and speech checks

Transcribe a recording, export TXT/SRT/VTT, compare generated speech with your script, or find keyword passages. Reuse applicable timed captions without another ASR call. Audio ASR times are milliseconds; sentence captions remain available when some word times are unusable. [Audio workflows](references/workflows/audio-content.md) connect original audio to visuals or target-language speech.

## Try it

- “Here is a product link. Make an ad for US customers.”
- “Use this product's photos to create an ecommerce hero image.”
- “Adapt this reference video to my product and produce an English version.”

Available models and account permissions determine which operations can run. Dynamic internet-style subtitle templates are currently unavailable; ordinary subtitles and video packaging remain available.
