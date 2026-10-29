# Vibbit Skills

![Vibbit](assets/vibbit-logo.png)

[中文说明](README.zh-CN.md)

Create images and videos with Vibbit through conversation in your Agent. Start with a product link, an idea, a script, or reference content.

> **Latest release: [2.18.7 — Skill + MCP for Codex and WorkBuddy](https://github.com/vibbit-ai/skills/releases/tag/v2.18.7)** · 2026-10-29
>
> Install the Skill and production MCP together with one command, including automatic refresh and a graceful restart fallback. [Read the update notes](CHANGELOG.md).

## What you can do

- **Ecommerce marketing:** Extract information from a product link, save it to your product library, and use product details and reference images to create ecommerce hero images, marketing visuals, and advertising videos.
- **Talking-head videos:** Use a script or library audio to drive an avatar, reuse a suitable existing performance, or add library B-roll when requested. Avatar-only videos keep the speaker on screen.
- **Video creation:** Turn ideas, scripts, and references into plans, storyboards, generated content, and revisions.
- **Person replacement:** Use your model photos to replace facial features and hairstyles in reference videos while retaining the selected outfit, scene, and presentation.
- **Comics:** Adapt novels, stories, or scripts into comic pages with consistent characters, settings, and props, then continue chapters or revise individual pages.
- **Creative reuse:** Save scripts, talent, and scenes in private persistent storage, extract new script templates from videos, and reuse selected entries for new-product video variants.
- **Multilingual content:** Translate videos while preserving original voices, or use your selected voice for everyone or individual speakers, with subtitles and speech corrections as needed.
- **Audio and subtitles:** Transcribe recordings, export subtitle files, check voiceovers against scripts, and locate keyword passages.
- **Semantic mixcuts:** Analyze reference edits and save reusable rules. The Agent matches library footage and arranges original sound, avatars, and narration, with cloud editing by default.
- **Material reuse:** Find library images, audio and video by name, tags or content; retrieve original files and matching clips for scripts, editing, references and continued production.
- **Video storage:** Save local or linked videos in your Vibbit material library, choose a name and an existing group, and optionally enable analysis.
- **Video links:** Use platform videos for translation, transcription and reference-based creation; additional platforms can use the optional yt-dlp downloader when the Agent environment supports it.

## Install

### Codex and WorkBuddy: Skill + MCP

Requires **Node.js 20+** with npm/npx and the selected desktop client already installed. Finish active tasks, then run the command in a system terminal. No npm account or manual package download is required.

**Codex**

```bash
npx -y --package=https://github.com/vibbit-ai/skills/releases/download/v2.18.7/vibbit-ai-plugin-installer-2.18.7.tgz vibbit-install --host codex --restart
```

**WorkBuddy**

```bash
npx -y --package=https://github.com/vibbit-ai/skills/releases/download/v2.18.7/vibbit-ai-plugin-installer-2.18.7.tgz vibbit-install --host workbuddy --restart
```

Use `--host all` if both clients are installed. The installer registers the Skill and production MCP and attempts to refresh the running client. `--restart` permits a normal quit and reopen when hot reload is unavailable. **WorkBuddy's first MCP trust prompt still needs your confirmation.**

For manual downloads and version details, see the [2.18.7 Release](https://github.com/vibbit-ai/skills/releases/tag/v2.18.7). This combined plugin retains the business scripts from standalone Skill 2.18.6.

### Other supported Agents: standalone Skill

The following command installs the standalone Skill; it does not register this release's MCP or run its refresh flow.

```bash
npx skills add vibbit-ai/skills
```

Follow the installation prompts to select your Agent.

If the command cannot complete installation, use a skill marketplace supported by your Agent:

- [SkillHub](https://skillhub.cn/skills/vibbit-skills)
- [ClawHub](https://clawhub.ai/zgissing/skills/vibbit-skills)

Install in the environment where your Agent actually runs, using the installation method supported by that platform.

After installation, ask your Agent to guide you through connecting your Vibbit account. Once the connection is verified, you can start creating.

## Start creating

- “Here is a product link. Make an ad for US customers.”
- “Use the product details and reference images to create an ecommerce hero image.”
- “Adapt this reference video into an ad for my product, then make an English version.”
- “Turn this story into a comic, keeping the characters and settings consistent.”
- “Save this video as a reusable script template for future products.”
- “Use my saved scripts and talent to make three videos for this new product.”

## Update

For the combined Codex/WorkBuddy plugin, use the installer command from the [release you want to install](https://github.com/vibbit-ai/skills/releases); the commands above are pinned to 2.18.7. Upgrade the complete plugin together.

For a standalone Skill installed with `npx skills add`, run:

```bash
npx --yes skills@latest update vibbit-skills -y
```

## Published plugin source

The complete [2.18.7 plugin source](plugins/vibbit/) is tracked in this repository. Its 223 files match the published Release package byte for byte, including the installer, MCP manifests and adapted Skill. See [verification and packaging](plugins/README.md) and the [file checksum manifest](plugins/release-2.18.7.json).

The standalone root Skill and its installation command remain available. The original 2.18.7 release tag and attachments are unchanged; its release notes link to the follow-up source commit.

## Links

- [Releases](https://github.com/vibbit-ai/skills/releases)
- [Changelog](CHANGELOG.md)
- [Vibbit](https://vibbit.ai/)
- [API documentation](https://vibbit.apifox.cn/)
