# Vibbit Skills

![Vibbit](assets/vibbit-logo.png)

[中文说明](README.zh-CN.md)

Create images and videos with Vibbit through conversation in your Agent. Start with a product link, an idea, a script, or reference content.

> **Latest release: [2.18.8 — Skill + MCP](https://github.com/vibbit-ai/skills/releases/tag/v2.18.8)** · 2026-10-29
>
> Install the complete plugin with one command: Skill and interactive MCP, with client-specific activation. [Read the update notes](CHANGELOG.md).

## Install Skill + interactive MCP

Run one command to install the **complete Vibbit plugin**, including the Skill and the MCP used for interactive avatar selection:

```bash
npx -y vibbit-ai/skills install
```

The installer detects **Codex, WorkBuddy, Claude Code and OpenClaw**, then installs or updates the complete **2.18.8 Skill + MCP** in every detected client. It registers `https://mcp.vibbit.cn/mcp` automatically. All four clients use the same published Skill and production MCP configuration.

Requires **Node.js 20+** with npm/npx, **Git**, and at least one supported client. Also satisfy your client's own Node.js requirements; the tested OpenClaw 2026.10.8 requires Node.js 24.22.1–24.x or 26.12.1+. Finish active tasks before installation.

- **Codex / WorkBuddy:** attempts runtime refresh, then a normal quit and reopen when necessary. Confirm WorkBuddy's initial MCP trust prompt in the client if it appears.
- **Claude Code:** installs and enables the plugin at user scope. New sessions load it automatically; an already-open session can use `/reload-plugins`. Its CLI does not provide an external reload API for that session.
- **OpenClaw:** installs and enables a compatible bundle, then requests `plugins reload` from the local Gateway. If the Gateway is stopped or declines the reload, the installer reports activation as pending instead of claiming success.

The command runs directly from this public GitHub repository. No npm account, npm package publication or manual MCP configuration is required. Other agents can use this same entry to check detection, but automatic registration currently supports the four clients above; an unsupported client is reported explicitly.

To install only in one client, append `--host codex`, `--host workbuddy`, `--host claude` or `--host openclaw`. The default `auto` selects detected clients; `--host all` requires all four. `--check` performs a read-only preflight and `--status` verifies installed files and enablement. `--no-restart` disables the Codex/WorkBuddy restart fallback; `--no-reload` skips the installer's additional refresh step. For nonstandard locations, use `--codex-cli FILE`, `--workbuddy-cli FILE`, `--claude-cli FILE` or `--openclaw-cli FILE`.

The launcher uses the current release content in [`plugins/vibbit/`](plugins/vibbit/). For Claude Code and OpenClaw, it adds host manifests in a verified persistent copy; the Skill and MCP files remain identical. The [2.18.8 TGZ/ZIP assets](https://github.com/vibbit-ai/skills/releases/tag/v2.18.8) contain the four-client installer and self-updater. The short command opts into stable automatic updates; fixed assets remain pinned unless `--update-channel stable` is supplied.

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

## Automatic updates

Before the first actual Vibbit operation in each conversation, the installed Skill attempts one complete-plugin check. A newer stable version is downloaded and SHA-256 verified, then the Skill and MCP are updated together for the recorded client/profile. Failed checks continue with the usable local version and are not retried in that conversation. Discussion, dry runs, local-only work and in-progress production skip the check.

Automatic updates do not restart clients. They try the supported runtime reload and report pending activation when a new session or host reload is required. Account/site selection, credentials and task snapshots remain outside the package. Set `VIBBIT_AUTO_UPDATE=0` to disable this behavior.

**Already on 2.18.7 or earlier? Run the installation command once to migrate.** The old installed plugin cannot acquire this new checker without that first update. Fixed TGZ/ZIP installs stay pinned by default; opt into stable updates with `--update-channel stable`.

For a read-only check of the loaded plugin, run `node "$VIBBIT_SKILL_DIR/scripts/plugin-update.cjs" check`. `npx -y vibbit-ai/skills install --check-updates` compares the remote stable release with the package carried by that command; `--check` still performs an environment preflight.

## Manual update

Run the same short command again to install the complete plugin provided by this repository, currently 2.18.8. For a fixed version, download its package from [Releases](https://github.com/vibbit-ai/skills/releases).

## Published plugin source

The complete [2.18.8 plugin source](plugins/vibbit/) is tracked in this repository. Its 230 files match the published Release package byte for byte, including the installer, MCP manifests and adapted Skill. See [verification and packaging](plugins/README.md) and the [file checksum manifest](plugins/release-2.18.8.json).

The historical 2.18.7 tag, assets and checksum manifest remain unchanged. Its matching source is available in [commit 28dc67a](https://github.com/vibbit-ai/skills/tree/28dc67ae4463ec36002d982b3e1912803449589f/plugins/vibbit).

## Links

- [Releases](https://github.com/vibbit-ai/skills/releases)
- [Changelog](CHANGELOG.md)
- [Legacy standalone Skill compatibility](LEGACY-INSTALL.md#english)
- [Vibbit](https://vibbit.ai/)
- [API documentation](https://vibbit.apifox.cn/)

