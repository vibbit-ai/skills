# Vibbit Skills

![Vibbit](assets/vibbit-logo.png)

[English](README.md)

在你熟悉的 Agent 中，通过对话使用 Vibbit 创作图片和视频。从商品链接、想法、脚本或参考内容开始。

> **最新发布：[2.18.7 — Codex / WorkBuddy 的 Skill + MCP 组合包](https://github.com/vibbit-ai/skills/releases/tag/v2.18.7)** · 2026-10-29
>
> 一条命令安装 Skill 和生产 MCP，并尝试自动刷新；无法热重载时正常重启客户端。[查看更新记录](CHANGELOG.md)。

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

## 安装

### Codex 和 WorkBuddy：Skill + MCP

需要 **Node.js 20+**（含 npm/npx）和已安装的目标客户端。先结束正在运行的任务，再从系统终端执行，无需 npm 账号或手动下载文件。

**Codex**

```bash
npx -y --package=https://github.com/vibbit-ai/skills/releases/download/v2.18.7/vibbit-ai-plugin-installer-2.18.7.tgz vibbit-install --host codex --restart
```

**WorkBuddy**

```bash
npx -y --package=https://github.com/vibbit-ai/skills/releases/download/v2.18.7/vibbit-ai-plugin-installer-2.18.7.tgz vibbit-install --host workbuddy --restart
```

两个客户端都已安装时可用 `--host all`。安装器会注册 Skill 和生产 MCP，并尝试刷新正在运行的客户端；`--restart` 允许在无法热重载时正常退出并重新打开客户端。**WorkBuddy 首次 MCP 信任仍需按提示确认。**

手动下载与版本详情见 [2.18.7 Release](https://github.com/vibbit-ai/skills/releases/tag/v2.18.7)。本次组合插件沿用独立 Skill 2.18.6 的业务脚本。

### 其他受支持的 Agent：独立 Skill

以下命令安装独立 Skill，不会注册本次 Release 的 MCP 或执行自动刷新流程。

```bash
npx skills add vibbit-ai/skills
```

按安装提示选择你使用的 Agent。

如果无法通过上述命令完成安装，可以从当前 Agent 支持的技能市场安装 Vibbit Skills：

- [SkillHub](https://skillhub.cn/skills/vibbit-skills)
- [ClawHub](https://clawhub.ai/zgissing/skills/vibbit-skills)

请通过当前平台支持的方式，安装到实际运行该 Agent 的环境中。

安装后，让你的 Agent 引导你连接 Vibbit 账户，验证成功后即可开始创作。

## 开始创作

- “这是商品链接，做一条面向美国用户的广告。”
- “结合商品信息和参考图，做一张电商主图。”
- “把这个参考视频改编成我的产品广告，再做英文版。”
- “把这段小说改成漫画，保持人物和场景一致。”
- “把这个视频存成可复用脚本模板，以后换商品继续用。”
- “使用已保存的脚本和模特，为这个新商品制作三条视频。”

## 更新

Codex / WorkBuddy 组合插件请使用[目标版本 Release](https://github.com/vibbit-ai/skills/releases) 中的安装命令，整体升级 Skill 和 MCP。上面的命令固定安装 2.18.7。

通过 `npx skills add` 安装的独立 Skill，可运行以下命令更新：

```bash
npx --yes skills@latest update vibbit-skills -y
```

## 发布源码

仓库已纳入完整的 [2.18.7 插件源码](plugins/vibbit/)，包括安装器、MCP 清单和适配后的 Skill。223 个文件与已发布 Release 包逐字节一致，核对方法见[校验与打包说明](plugins/README.md)和[文件校验清单](plugins/release-2.18.7.json)。

根目录的独立 Skill 及原安装命令继续保留。原有 2.18.7 Release 标签和附件保持不变，发布说明会链接到补齐源码的提交。

## 相关链接

- [版本发布](https://github.com/vibbit-ai/skills/releases)
- [更新记录](CHANGELOG.md)
- [Vibbit 官网](https://vibbit.ai/)
- [API 文档](https://vibbit.apifox.cn/)
