# Vibbit Skills

![Vibbit](assets/vibbit-logo.png)

[English](README.md)

在你熟悉的 Agent 中，通过对话使用 Vibbit 创作图片和视频。从商品链接、想法、脚本或参考内容开始。

> **最新发布：[2.18.7 — Codex / WorkBuddy 的 Skill + MCP 组合包](https://github.com/vibbit-ai/skills/releases/tag/v2.18.7)** · 2026-10-29
>
> 一条命令安装完整插件，包含 Skill、交互 MCP 和客户端自动刷新。[查看更新记录](CHANGELOG.md)。

## 安装 Skill + 交互 MCP

选择你使用的客户端，执行对应的一条命令，即可安装 **Vibbit 完整插件**，包含 Skill 和用于数字人交互选择的 MCP。安装器会自动注册生产 MCP。

需要 **Node.js 20+**（含 npm/npx）和已安装的目标客户端。先结束正在运行的任务，再从系统终端执行。

**Codex**

```bash
npx -y --package=https://github.com/vibbit-ai/skills/releases/download/v2.18.7/vibbit-ai-plugin-installer-2.18.7.tgz vibbit-install --host codex --restart
```

**WorkBuddy**

```bash
npx -y --package=https://github.com/vibbit-ai/skills/releases/download/v2.18.7/vibbit-ai-plugin-installer-2.18.7.tgz vibbit-install --host workbuddy --restart
```

安装器会尝试自动刷新客户端；`--restart` 允许在无法热重载时正常退出并重新打开。**WorkBuddy 首次出现 MCP 信任提示时，在客户端确认即可。** 不需要手动填写 MCP 地址或提前下载安装包。

两个客户端都已安装时才使用 `--host all`。手动下载见 [2.18.7 Release](https://github.com/vibbit-ai/skills/releases/tag/v2.18.7)。

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

## 更新

使用[目标版本 Release](https://github.com/vibbit-ai/skills/releases) 中的安装命令，整体升级 Skill 和 MCP。上面的命令可安装或更新到 2.18.7。

## 发布源码

仓库已纳入完整的 [2.18.7 插件源码](plugins/vibbit/)，包括安装器、MCP 清单和适配后的 Skill。223 个文件与已发布 Release 包逐字节一致，核对方法见[校验与打包说明](plugins/README.md)和[文件校验清单](plugins/release-2.18.7.json)。

原有 2.18.7 Release 标签和附件保持不变，发布说明链接到补齐源码的提交。

## 相关链接

- [版本发布](https://github.com/vibbit-ai/skills/releases)
- [更新记录](CHANGELOG.md)
- [旧版独立 Skill 兼容说明](LEGACY-INSTALL.md#中文)
- [Vibbit 官网](https://vibbit.ai/)
- [API 文档](https://vibbit.apifox.cn/)

