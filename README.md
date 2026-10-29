# Vibbit Skills

![Vibbit](assets/vibbit-logo.png)

[中文说明](README.zh-CN.md)

Create images and videos with Vibbit through conversation in your Agent. Start with a product link, an idea, a script, or reference content.

> **Latest release: [2.18.7 — Skill + MCP for Codex and WorkBuddy](https://github.com/vibbit-ai/skills/releases/tag/v2.18.7)** · 2026-10-29
>
> Install the complete plugin with one command: Skill, interactive MCP and automatic client refresh. [Read the update notes](CHANGELOG.md).

## Install Skill + interactive MCP

Run one command to install the **complete Vibbit plugin**, including the Skill and the MCP used for interactive avatar selection:

```bash
npx -y github:vibbit-ai/skills install
```

The installer detects Codex and WorkBuddy. If one is installed, it installs there; if both are installed, it installs in both. It automatically registers the production MCP.

Requires **Node.js 20+** with npm/npx, **Git**, and at least one supported client. Finish active tasks and run the command in a system terminal. The installer attempts a refresh and, when necessary, a normal quit and reopen. **If WorkBuddy shows its first MCP trust prompt, confirm it in the client.**

The command runs directly from this public GitHub repository. No npm account, npm package publication or manual MCP configuration is required.

To install only in one client, append `--host codex` or `--host workbuddy`. For a read-only check, append `--check`. Use `--no-restart` to disable the restart fallback, or `--no-reload` to install without refreshing. For nonstandard client locations, use `--codex-cli FILE` or `--workbuddy-cli FILE`; run the command with `--help` for details.

This entry installs the unchanged 2.18.7 plugin from [`plugins/vibbit/`](plugins/vibbit/). The existing [Release download commands](https://github.com/vibbit-ai/skills/releases/tag/v2.18.7) remain available.

After installation, ask your Agent to guide you through connecting your Vibbit account, then tell it what you want to create.

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

## Start creating

- “Here is a product link. Make an ad for US customers.”
- “Use the product details and reference images to create an ecommerce hero image.”
- “Adapt this reference video into an ad for my product, then make an English version.”
- “Turn this story into a comic, keeping the characters and settings consistent.”
- “Save this video as a reusable script template for future products.”
- “Use my saved scripts and talent to make three videos for this new product.”

## Update

Run the same short command again to install the complete plugin provided by this repository, currently 2.18.7. For a fixed release, use its [Release installer command](https://github.com/vibbit-ai/skills/releases).

## Published plugin source

The complete [2.18.7 plugin source](plugins/vibbit/) is tracked in this repository. Its 223 files match the published Release package byte for byte, including the installer, MCP manifests and adapted Skill. See [verification and packaging](plugins/README.md) and the [file checksum manifest](plugins/release-2.18.7.json).

The original 2.18.7 release tag and attachments are unchanged; its release notes link to the follow-up source commit.

## Links

- [Releases](https://github.com/vibbit-ai/skills/releases)
- [Changelog](CHANGELOG.md)
- [Legacy standalone Skill compatibility](LEGACY-INSTALL.md#english)
- [Vibbit](https://vibbit.ai/)
- [API documentation](https://vibbit.apifox.cn/)

