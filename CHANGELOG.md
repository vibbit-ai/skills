# Changelog / 更新记录

## 2.18.7 — 2026-10-29

[GitHub Release](https://github.com/vibbit-ai/skills/releases/tag/v2.18.7) · Published by / 发布账号：`zGissing`

### 中文

本次发布为 **Codex / WorkBuddy 的 Skill + MCP 组合插件与安装器 2.18.7**。组合包沿用独立 Skill 2.18.6 的 31 个业务脚本；仓库根目录的独立 Skill 仍为 2.18.6。

- **一键安装：** 通过 GitHub Release 的 TGZ 直接运行安装器，同时安装 Skill 并注册生产 MCP，无需手动下载或登录 npm。
- **双客户端支持：** 支持 Codex、WorkBuddy，或在两个客户端均已安装时使用 `--host all`。
- **自动刷新：** 安装后尝试热重载；使用 `--restart` 时，无法热重载则正常退出并重新打开客户端，拒绝退出时不强制结束进程。
- **持久安装来源：** 安装器保存经校验的持久副本，清理 npx 缓存不会删除该来源。
- **生产数字人选择器：** MCP 使用 `https://mcp.vibbit.cn/mcp`，保留标准 Skill 的国内／国际站业务账号选择。
- **发行文件：** 提供完整 TGZ、标准 ZIP 和各自的 SHA-256 校验文件。

安装需要 Node.js 20+ 和对应桌面客户端；执行前先结束活动任务。WorkBuddy 首次 MCP 信任仍需用户确认。安装命令见 [中文说明](README.zh-CN.md#安装)。

验证：29 项自动化测试通过，WorkBuddy 官方 CLI 在隔离配置中通过首次安装、重复安装和 HTTP reload 验证；发布后通过匿名下载、附件哈希校验，以及全新 npx 缓存下两个客户端的只读预检查。真实桌面重启、Windows 实机和内嵌卡片点击回传仍需客户端验收。

### English

This release provides the **2.18.7 combined Skill + MCP plugin and installer for Codex and WorkBuddy**. It retains the 31 business scripts from standalone Skill 2.18.6; the standalone Skill at this repository's root remains 2.18.6.

- Install the Skill and register the production MCP together, directly from a GitHub Release TGZ through npx.
- Select Codex, WorkBuddy, or both installed clients with `--host all`.
- Attempt hot reload after installation. With `--restart`, fall back to a normal desktop quit and reopen without force-killing clients.
- Keep a verified persistent package source independent of npx's download cache.
- Use the production avatar-picker MCP at `https://mcp.vibbit.cn/mcp`, while retaining the standard Skill's China/international business account selection.
- Distribute complete TGZ and ZIP packages with SHA-256 checksum files.

Requires Node.js 20+ and the selected desktop client. Finish active tasks before installation. WorkBuddy's initial MCP trust confirmation remains a user action. Commands are in the [English installation guide](README.md#install).

Validation includes 29 automated tests, WorkBuddy native fresh/repeat installation and HTTP reload in an isolated profile, anonymous asset downloads and matching hashes, and read-only checks through fresh npx caches for both clients. Actual desktop restarts, Windows machines, and native card selection/callback still require client acceptance testing.
