# Changelog / 更新记录

## 2.18.9 — 2026-10-30

### Same-version assessment correction / 同版本评测修复

- Product/share-link routing guidance and Amazon misuse guard; measured Seedance reference-image checks and thumbnail preparation guidance.
- Translation source-duration recovery instructions without replaying writes or discarding successful outputs; permanent-URL backend compatibility remains pending.
- Visible 120-second material-search timeout and a verified Reddit limit=5 default with local rejection of unconfirmed values.
- 标准组合包、WorkBuddy 连接器与豆包插件统一为 2.18.9；附件与校验值同步替换，根目录独立 Skill 也同步修复并保留原安装方式。
- Stable self-updates now compare content revisions as well as versions. Existing earlier 2.18.9 installations need one run of `npx -y vibbit-ai/skills install` to obtain the new checker.
- Validation: 444 Skill runtime tests, 34 Skill release checks, 91 plugin tests (including same-version revision checks), and platform packaging checks. No real media generation or backend deployment.


[GitHub Release](https://github.com/vibbit-ai/skills/releases/tag/v2.18.9) · Published by / 发布账号：`zGissing`

- **素材选择：** 新增图片、视频、音频浏览与选择适配，支持真实筛选、分页、私有快照和选中后刷新原文件。
- **素材详情：** 视频使用“素材信息 / 镜头拆分”两个 Tab；内容分析和转录属于每个镜头。镜头分页保留当前选择，独立片段可播放，有真实源时间时可在原片预览。
- **商品选择：** 新增商品浏览、详情与显式参考图选择；按真实零基页查询，保留商品 ID、图片归属与异步查询恢复。
- **Account and identity checks:** picker events resolve against private account-bound snapshots, preserve exact IDs and re-read original records. Previewing does not authorize generation or trigger analysis.
- Four-client installation, complete-plugin self-updates and the standalone root Skill entry remain available. The original picker-adapter publication preserved the 31 business scripts; the assessment correction above updates the shared client and guidance.
- **MCP rollout:** at the original picker-adapter publication, production exposed the avatar picker. Material/product UI requires a separate service deployment; the installed Skill retains the complete text/file fallback until those tools are exposed. This release does not deploy the remote service.

## 2.18.8 — 2026-10-29

[GitHub Release](https://github.com/vibbit-ai/skills/releases/tag/v2.18.8) · Published by / 发布账号：`zGissing`

- **Complete plugin self-check:** before the first actual operation in each conversation, check the stable manifest once; download and checksum-verify a newer complete package and update only the recorded client/profile. Skill and MCP update together.
- **完整插件自动更新：** 保留单会话防重复、失败后继续本地版本、关闭自动更新、固定版本、制作中跳过与账号配置保留；自动更新不触发客户端重启，无法热加载时报告待加载。
- Stable installs carry explicit host/profile tracking. Local copies without tracking are not automatically reinstalled. Fixed archives remain pinned unless `--update-channel stable` is selected.
- 新增真正的远端版本检查：已安装插件的 `plugin-update.cjs check`；安装入口的 `--check-updates` 检查其携带包版本。原 `--check` 环境预检查继续保留。
- **迁移：** 2.18.7 及更早组合插件先执行一次 `npx -y vibbit-ai/skills install`，随后新会话使用自检流程。旧版独立 Skill 入口保留。
- Validation includes checksum and complete-archive tests, session de-duplication after success/failure, pinned/disabled/offline behavior, timeout process-tree cleanup, concurrent updates, native Claude Code 2.18.7 → 2.18.8 update with a fixture feed, WorkBuddy fresh/repeat/status and isolated runtime reload, and OpenClaw package upgrade. No media generation or card re-testing.

## 2.18.7 — 2026-10-29

[GitHub Release](https://github.com/vibbit-ai/skills/releases/tag/v2.18.7) · Published by / 发布账号：`zGissing`

### Four-client launcher / 四端统一安装入口

- The short command now detects Codex, WorkBuddy, Claude Code and OpenClaw, installing the same 2.18.7 Skill and production MCP for every detected client. Other clients are reported as unsupported instead of silently receiving an older Skill.
- 短命令增加 Claude Code 用户插件与 OpenClaw 兼容插件包适配，四端统一安装 Skill + MCP；支持 `--host claude` 和 `--host openclaw`。所有目标预检查完成后才开始安装。
- Claude Code loads the enabled plugin in new sessions; existing sessions can use `/reload-plugins`. OpenClaw requests a Gateway plugin reload and reports pending activation honestly when unavailable. Existing host policies and trust prompts remain in effect.
- 修复短入口在 Node.js 24 下准备桌面插件持久副本的目录复制问题。原 2.18.7 的 223 个发行文件、Release 标签、TGZ/ZIP 附件和独立 Skill 入口保持不变。
- Validation: launcher tests plus isolated native fresh/repeat installation on Claude Code 2.1.185 and OpenClaw 2026.10.8; installed Skill and MCP bytes checked against the release. These checks do not run media jobs or repeat card-interaction acceptance testing.

### Short GitHub installation command / GitHub 短命令安装

```bash
npx -y vibbit-ai/skills install
```

- Added a GitHub executable entry that detects Codex and WorkBuddy and installs the complete Skill + MCP plugin in every detected client. No npm registry publication is required.
- 新增 GitHub 运行入口，自动识别已安装的 Codex／WorkBuddy；单端安装单端，双端一起安装 Skill 和 MCP，并尝试刷新或正常重启。支持 `--host` 指定客户端、`--check` 只读检查、`--no-restart` 禁用重启兜底。
- This entry reuses the unchanged 2.18.7 release source. The original tag, assets, standalone Skill and `npx skills add vibbit-ai/skills` compatibility remain available.
- 根目录新增命令入口；原 2.18.7 发行包、标签、业务脚本和独立 Skill 入口不变。需要 Node.js 20+、Git 和对应客户端；WorkBuddy 首次信任按客户端提示确认。

### Source synchronization / 源码补齐

- Added the complete 223-file release source under [`plugins/vibbit/`](plugins/vibbit/), plus a public hash manifest and read-only verification command. Files and executable flags match the published 2.18.7 TGZ.
- 补齐安装器、Codex / WorkBuddy 插件清单、生产 MCP 配置和适配后的完整 Skill；根目录独立 Skill 与 `npx skills add vibbit-ai/skills` 入口继续保留。
- The original release tag and assets remain unchanged. The release notes identify the matching follow-up source commit.

### 中文

本次发布为 **Codex / WorkBuddy 的 Skill + MCP 组合插件与安装器 2.18.7**。组合包沿用独立 Skill 2.18.6 的 31 个业务脚本；仓库根目录的独立 Skill 仍为 2.18.6。

- **一键安装：** 通过 GitHub Release 的 TGZ 直接运行安装器，同时安装 Skill 并注册生产 MCP，无需手动下载或登录 npm。
- **双客户端支持：** 支持 Codex、WorkBuddy，或在两个客户端均已安装时使用 `--host all`。
- **自动刷新：** 安装后尝试热重载；使用 `--restart` 时，无法热重载则正常退出并重新打开客户端，拒绝退出时不强制结束进程。
- **持久安装来源：** 安装器保存经校验的持久副本，清理 npx 缓存不会删除该来源。
- **生产数字人选择器：** MCP 使用 `https://mcp.vibbit.cn/mcp`，保留标准 Skill 的国内／国际站业务账号选择。
- **发行文件：** 提供完整 TGZ、标准 ZIP 和各自的 SHA-256 校验文件。

安装需要 Node.js 20+ 和对应桌面客户端；执行前先结束活动任务。WorkBuddy 首次 MCP 信任仍需用户确认。安装命令见 [中文说明](README.zh-CN.md#安装-skill--交互-mcp)。

验证：29 项自动化测试通过，WorkBuddy 官方 CLI 在隔离配置中通过首次安装、重复安装和 HTTP reload 验证；发布后通过匿名下载、附件哈希校验，以及全新 npx 缓存下两个客户端的只读预检查。真实桌面重启、Windows 实机和内嵌卡片点击回传仍需客户端验收。

### English

This release provides the **2.18.7 combined Skill + MCP plugin and installer for Codex and WorkBuddy**. It retains the 31 business scripts from standalone Skill 2.18.6; the standalone Skill at this repository's root remains 2.18.6.

- Install the Skill and register the production MCP together, directly from a GitHub Release TGZ through npx.
- Select Codex, WorkBuddy, or both installed clients with `--host all`.
- Attempt hot reload after installation. With `--restart`, fall back to a normal desktop quit and reopen without force-killing clients.
- Keep a verified persistent package source independent of npx's download cache.
- Use the production avatar-picker MCP at `https://mcp.vibbit.cn/mcp`, while retaining the standard Skill's China/international business account selection.
- Distribute complete TGZ and ZIP packages with SHA-256 checksum files.

Requires Node.js 20+ and the selected desktop client. Finish active tasks before installation. WorkBuddy's initial MCP trust confirmation remains a user action. Commands are in the [English installation guide](README.md#install-skill--interactive-mcp).

Validation includes 29 automated tests, WorkBuddy native fresh/repeat installation and HTTP reload in an isolated profile, anonymous asset downloads and matching hashes, and read-only checks through fresh npx caches for both clients. Actual desktop restarts, Windows machines, and native card selection/callback still require client acceptance testing.
