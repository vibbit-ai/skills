# Vibbit Skills

[English](README.md)

把商品链接、想法、脚本、参考内容和已有素材，衔接成电商主图、营销图片、广告视频、数字人口播、短剧和多语言视频。也支持商品库管理、选品研究、策划、媒体生成、音视频转写、字幕文件、配音校对、审片与修改。

## 安装

```bash
npx skills add vibbit-ai/skills
```

**2.16.1** 是同时支持中国站和国际站的同一 Skill。交流语言跟随用户，作品语言根据创作要求选择；语言与账号站点分别处理。首次从 GitHub／终端安装且无来源信息时默认国际站；已有配置继续使用原站点。

## 配置账号

让助手配置 Vibbit。本机支持时会打开私有配置页：选择平时使用的站点，在对应网站创建 Key，粘贴到页面并验证。不要把密钥发到聊天中。

- [中国站 Key 页面](https://app.vibbit.cn/api-keys)
- [国际站 Key 页面](https://app.vibbit.ai/api-keys)

两站账号、API Key、积分、商品和素材完全独立。国内官网可提供以下完整安装引导：

> 安装 `npx skills add vibbit-ai/skills`，并使用 https://app.vibbit.cn/api-keys 配置我的 Vibbit 账号。把该网址作为配置来源；已有站点配置则继续复用。

国际官网将网址换为 https://app.vibbit.ai/api-keys。远程或宿主环境配置密钥时，同时设置 `VIBBIT_REGION=cn` 或 `VIBBIT_REGION=global`。具体本机配置和切站见 [认证](skills/vibbit-skills/references/runtime/authentication.md)。

## 更新

每个会话首次实际使用 Vibbit 前，助手尝试一次对应安装范围的更新；失败时继续使用可用本地版本。设置 `VIBBIT_AUTO_UPDATE=0` 或告诉助手跳过，可关闭自动更新。手动更新：

```bash
npx --yes skills@latest update vibbit-skills -y
```

更新需要安装器记录的来源；手动复制或 ZIP 安装先通过安装命令迁移一次。账号凭据在 Skill 外保存。详见 [更新行为](skills/vibbit-skills/references/runtime/skill-updates.md)。

## 音频、字幕与配音检查

支持录音转写、TXT/SRT/VTT 导出、配音与采用稿比较和关键词片段定位。已有适用的字幕时间轴直接复用；音频 ASR 时间为毫秒，个别词时间不可用时仍可导出有效句级字幕。[音频工作流](skills/vibbit-skills/references/workflows/audio-content.md) 可衔接原声配画面或目标语言配音。

## 可以这样开始

- “这是商品链接，做一条面向美国用户的广告。”
- “结合商品信息和参考图，做一张电商主图。”
- “把这个参考视频改编成我的产品广告，再做英文版。”

实际能力取决于可用模型和账号权限。网感动态字幕模板暂不支持，普通字幕与普通视频包装继续可用。
