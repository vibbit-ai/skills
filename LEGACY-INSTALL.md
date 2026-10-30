# Legacy standalone Skill compatibility

## English

**New Codex and WorkBuddy users should use the [complete Skill + interactive MCP installer](README.md#install-skill--interactive-mcp).** It also installs the complete plugin for users who previously installed only the Skill.

The standalone root Skill is synchronized to 2.18.9 with the assessment fixes and remains available for existing workflows and other Agents that support Skills. It does not register the interactive MCP or run the plugin refresh flow.

Install the standalone Skill:

```bash
npx skills add vibbit-ai/skills
```

Follow the prompts to select your Agent. Install in the environment where that Agent runs.

Update an existing standalone Skill:

```bash
npx --yes skills@latest update vibbit-skills -y
```

Standalone Skill listings remain available on [SkillHub](https://skillhub.cn/skills/vibbit-skills) and [ClawHub](https://clawhub.ai/zgissing/skills/vibbit-skills). These are legacy Skill entry points; use the complete installer above to add the MCP.

After installation, ask your Agent to guide you through connecting your Vibbit account.

## 中文

**Codex 和 WorkBuddy 新用户请使用[包含交互 MCP 的完整安装器](README.zh-CN.md#安装-skill--交互-mcp)。** 以前只安装了 Skill 的用户，也可以运行该安装命令安装完整插件。

根目录独立 Skill 已同步至 2.18.9 并包含本轮评测修复，原入口继续保留，供已有使用流程以及支持 Skill 的其他 Agent 使用。它不会注册交互 MCP，也不会执行插件刷新流程。

安装独立 Skill：

```bash
npx skills add vibbit-ai/skills
```

按提示选择 Agent，安装到实际运行该 Agent 的环境中。

更新已有独立 Skill：

```bash
npx --yes skills@latest update vibbit-skills -y
```

[SkillHub](https://skillhub.cn/skills/vibbit-skills) 和 [ClawHub](https://clawhub.ai/zgissing/skills/vibbit-skills) 继续保留原独立 Skill 入口。需要 MCP 时，请使用上面的完整安装器。

安装后，让 Agent 引导你连接 Vibbit 账户。

