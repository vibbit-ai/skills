# Vibbit Skills

![Vibbit](assets/vibbit-logo.png)

[English](README.md)

在你熟悉的 Agent 中，通过对话使用 Vibbit 创作图片和视频。从商品链接、想法、脚本或参考内容开始。

> **最新发布：[2.18.8 — Skill + MCP 组合包](https://github.com/vibbit-ai/skills/releases/tag/v2.18.8)** · 2026-10-29
>
> 一条命令安装完整插件，包含 Skill 和交互 MCP，并按客户端规则启用。[查看更新记录](CHANGELOG.md)。

## 安装 Skill + 交互 MCP

执行一条命令，安装 **Vibbit 完整插件**，包含 Skill 和用于数字人交互选择的 MCP：

```bash
npx -y vibbit-ai/skills install
```

安装器会自动识别 **Codex、WorkBuddy、Claude Code 和 OpenClaw**，为找到的客户端统一安装或更新 **2.18.8 Skill + MCP**，自动注册 `https://mcp.vibbit.cn/mcp`。四端使用相同的已发布 Skill 和生产 MCP 配置。

需要 **Node.js 20+**（含 npm/npx）、**Git** 和至少一个受支持的客户端，同时满足客户端自身的 Node.js 要求；本次验证的 OpenClaw 2026.10.8 要求 Node.js 24.22.1–24.x 或 26.12.1+。安装前请先结束活动任务。

- **Codex / WorkBuddy：** 尝试刷新运行时，必要时正常退出并重新打开客户端。WorkBuddy 首次出现 MCP 信任提示时，在客户端确认即可。
- **Claude Code：** 在用户范围安装并启用插件，新会话自动加载；已经打开的会话可运行 `/reload-plugins`。其 CLI 没有对现有会话提供外部刷新接口。
- **OpenClaw：** 安装并启用兼容插件包，再向本地 Gateway 请求 `plugins reload`。Gateway 未运行或未接受刷新时，安装器会明确报告待加载状态。

命令直接从这个公开 GitHub 仓库运行，无需 npm 账号、发布 npm 包或手动配置 MCP。其他 Agent 也统一使用此入口检查识别结果；自动注册目前支持上述四种客户端，遇到未支持的客户端会明确提示。

只安装到指定客户端时，加 `--host codex`、`--host workbuddy`、`--host claude` 或 `--host openclaw`。默认 `auto` 选择检测到的客户端，`--host all` 要求四种客户端都存在。`--check` 只读预检查，`--status` 核对已安装文件和启用状态；`--no-restart` 禁用 Codex/WorkBuddy 重启兜底，`--no-reload` 跳过安装器的额外刷新步骤。非标准位置可用 `--codex-cli FILE`、`--workbuddy-cli FILE`、`--claude-cli FILE` 或 `--openclaw-cli FILE` 指定。

该入口使用 [`plugins/vibbit/`](plugins/vibbit/) 中的当前发行内容，为 Claude Code 和 OpenClaw 在经校验的持久副本中增加宿主清单，Skill 和 MCP 文件保持一致。[2.18.8 TGZ/ZIP 附件](https://github.com/vibbit-ai/skills/releases/tag/v2.18.8)也包含四端安装器与自检脚本；短命令默认跟随稳定版，固定附件需明确加 `--update-channel stable` 才自动更新。

安装后，让 Agent 引导你连接 Vibbit 账户，再告诉它你想创作什么。

## 可以做什么

- **电商营销：** 提取商品链接中的信息，保存到商品库，结合商品信息和参考图制作电商主图、营销图片和广告视频。
- **数字人口播：** 使用脚本或素材库音频驱动数字人，复用符合要求的已有口播，也可按需加入库内 B-roll；纯数字人视频保持人物出镜。
- **视频创作：** 从想法、脚本和参考内容出发，完成策划、分镜、生成与修改。
- **人物替换：** 使用你提供的模特照片替换参考视频中的五官和发型，保留选定的服装、场景与展示方式。
- **小说改漫画：** 将小说、故事或剧本改编成漫画页，保持人物、场景和道具连续，支持继续章节和逐页修改。
- **创作资料复用：** 在私有持久目录保存脚本、模特和场景，从视频提取新脚本模板，再为新商品选择搭配批量制作视频。
- **多语言内容：** 翻译视频并默认保留原始音色，也可按要求统一声音或替换指定说话人，制作字幕并修正个别配音。
- **音频与字幕：** 转写录音、导出字幕文件、校对配音内容和定位关键词片段。
- **素材混剪：** 分析参考成片并保存可复用剪法，由 Agent 从素材库匹配画面，编排原声、数字人与旁白，默认使用云端剪辑。
- **素材查找与复用：** 按名称、标签或内容查找库内图片、音频和视频，读取原文件与匹配片段，用于配画面、剪辑、生成参考和继续制作。
- **视频入库：** 将本地或链接视频保存到 Vibbit 素材库，指定名称与已有分组，并按需要开启分析。
- **视频链接：** 使用平台视频进行翻译、转写与参考创作，其他平台可在 Agent 环境支持时通过可选的 yt-dlp 下载工具获取视频。

## 开始创作

- “这是商品链接，做一条面向美国用户的广告。”
- “结合商品信息和参考图，做一张电商主图。”
- “把这个参考视频改编成我的产品广告，再做英文版。”
- “把这段小说改成漫画，保持人物和场景一致。”
- “把这个视频存成可复用脚本模板，以后换商品继续用。”
- “使用已保存的脚本和模特，为这个新商品制作三条视频。”

## 自动自检更新

每个会话首次实际使用 Vibbit 前，已安装 Skill 尝试一次完整插件自检。有新稳定版时，下载完整包并校验 SHA-256，再整体更新当前安装记录对应的客户端／配置中的 Skill 和 MCP。检查失败继续使用可用的本地版本，本会话不重复重试。纯讨论、dry-run、纯本地工作和已在进行的制作流程跳过。

自动更新不重启客户端，只尝试宿主支持的运行时刷新；需要新会话或宿主 reload 时明确报告待加载。站点、账号凭据和任务快照保存在包外。`VIBBIT_AUTO_UPDATE=0` 可关闭自动更新。

**已经安装 2.18.7 或更早组合插件的用户，先运行一次安装命令迁移。** 原来的已安装插件没有本次新增的自检脚本。固定 TGZ/ZIP 默认保持固定版本；安装时明确加 `--update-channel stable` 才跟随稳定版。

只读检查当前加载的插件，运行 `node "$VIBBIT_SKILL_DIR/scripts/plugin-update.cjs" check`。`npx -y vibbit-ai/skills install --check-updates` 读取远端稳定版，并与该命令携带的包版本比较；`--check` 仍是环境预检查。

## 手动更新

再次运行同一条短命令，安装仓库当前提供的完整插件，当前为 2.18.8。需要固定版本时，从 [Releases](https://github.com/vibbit-ai/skills/releases) 下载对应安装包。

## 发布源码

仓库已纳入完整的 [2.18.8 插件源码](plugins/vibbit/)，包括安装器、MCP 清单和适配后的 Skill。230 个文件与已发布 Release 包逐字节一致，核对方法见[校验与打包说明](plugins/README.md)和[文件校验清单](plugins/release-2.18.8.json)。

历史 2.18.7 标签、附件和校验清单保持不变，对应源码仍可在[原提交](https://github.com/vibbit-ai/skills/tree/28dc67ae4463ec36002d982b3e1912803449589f/plugins/vibbit)查阅。

## 相关链接

- [版本发布](https://github.com/vibbit-ai/skills/releases)
- [更新记录](CHANGELOG.md)
- [旧版独立 Skill 兼容说明](LEGACY-INSTALL.md#中文)
- [Vibbit 官网](https://vibbit.ai/)
- [API 文档](https://vibbit.apifox.cn/)

