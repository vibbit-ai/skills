# Vibbit 标准 Skill + MCP 组合包

版本：`2.18.7`，包含标准 Skill、生产 MCP 和 Codex / WorkBuddy 安装器。生产 MCP 为 `https://mcp.vibbit.cn/mcp`。本次是组合包与安装器升级，业务脚本沿用正式 Skill 2.18.6。通过 GitHub 仓库 `vibbit-ai/skills` 的 Release 分发，无需 npm 账号。

## 安装

需要 Node.js 20+，并预先安装所选客户端。在任务结束后，从系统终端运行，避免当前任务因客户端重启中断。

通过 GitHub Release 直接安装，无需手动下载 ZIP 或 TGZ：

Codex：

```bash
npx -y --package=https://github.com/vibbit-ai/skills/releases/download/v2.18.7/vibbit-ai-plugin-installer-2.18.7.tgz vibbit-install --host codex --restart
```

WorkBuddy：

```bash
npx -y --package=https://github.com/vibbit-ai/skills/releases/download/v2.18.7/vibbit-ai-plugin-installer-2.18.7.tgz vibbit-install --host workbuddy --restart
```

两端都已安装时可用 `--host all`。以上命令固定使用 2.18.7，下载后执行同包的安装器；不会从 npm registry 查找 `@vibbit-ai/plugin-installer`。

完整解压 ZIP 后，一条命令安装两个客户端并自动刷新：

```bash
node install.cjs --host all --restart
```

只安装一个客户端，将 `all` 换成 `codex` 或 `workbuddy`。macOS 也可双击 `install-codex.command` 或 `install-workbuddy.command`；这两个入口均允许自动重启兜底。

`--restart` 表示：先尝试连接正在运行的客户端完成热重载，不可用时正常退出并重新打开客户端。不会强制结束进程；客户端拒绝退出或系统权限阻止时会报告未完成。成功后直接进入新会话测试，无需手动填写 MCP 地址或点击刷新。

安装器将完整包校验后保存到 `~/.vibbit-installer/packages/`，再注册该持久目录；删除下载的 ZIP、解压目录或 npx 缓存不影响已注册来源。安装报告位于 `~/.vibbit-installer/reports/`。标准清单和兼容清单指向同一个 MCP，不会创建两个服务。

也可使用同次构建的本地 npm 包，不需要先发布到 npm：

```bash
npx --offline --yes --package ./vibbit-ai-plugin-installer-2.18.7.tgz vibbit-install --host all --restart
```

插件 ID：`vibbit@vibbit-local`；Skill：`vibbit-skills`。旧测试插件 `vibbit-test` 是另一插件，本安装器不会删除它或其他独立 Skill。测试时明确使用 `vibbit` 插件内的 Skill，并以实际加载路径定位脚本。

## 不同客户端的生效方式

安装器会分别记录文件安装、热重载、正常重启、信任与卡片验证状态。自动刷新不代替 WorkBuddy 首次 MCP 信任；如果客户端提示未信任，在 MCP 管理页确认一次即可。安装器不改写信任记录，不读取业务账号 Key。

| 客户端 | 安装后的操作 |
| --- | --- |
| Codex 桌面 | 尝试现有 App Server proxy，确认它承载当前会话或使用显式指定的 socket 后，刷新插件、Skill 缓存与 MCP。无法定位真实运行时则用正常重启兜底。新起临时 App Server 不算桌面刷新。 |
| WorkBuddy 桌面 | 发现 WorkBuddy 进程的本机 HTTP 监听端口，调用公开插件 reload API；运行时认证不可用时用正常重启兜底。只使用继承的运行时凭据，不读取其他进程内存或业务账号。 |
| 未运行的桌面应用 | 安装完成后自动启动；不会新开对话或发送业务请求。 |

macOS 提供正常退出与重新启动适配；Windows 普通桌面安装路径也有适配代码，尚未做 Windows 实机验证。商店安装或其他路径无法自动识别时会明确返回待处理状态，不报刷新成功。

依据：[Codex App Server](https://learn.chatgpt.com/docs/app-server)、[CodeBuddy HTTP API](https://www.codebuddy.cn/docs/cli/http-api)、[WorkBuddy MCP 信任引导](https://www.codebuddy.cn/docs/workbuddy/Changelog)。

## 检查与恢复

- `node install.cjs --host all --check`：只读预检查，不安装、不启动或刷新客户端。
- `node install.cjs --host all --status`：只读核对当前版本安装文件/状态，不触发刷新。
- `node install.cjs --host all --reload-only --restart`：核对已安装版本后重试刷新，不重装插件。
- `--no-reload`：仅安装。省略 `--restart` 时会尝试热重载，但不会退出正在运行的客户端。
- 退出码 `0` 表示所请求步骤完成，`1` 表示安装/校验失败，`2` 表示安装完成但刷新仍待处理。报告中的 `restarted` 只证明客户端重新启动，不证明首次信任或内嵌卡片已通过。

高级路径参数：`--codex-cli FILE`、`--workbuddy-cli FILE`、`--workbuddy-config DIR`、`--store DIR`。已有明确运行时地址时可用 `--codex-socket FILE` 或 `--workbuddy-url http://127.0.0.1:PORT`；不会把任意远程地址当作本机刷新接口。所有客户端完成安装后才安排重启，独立后台助手会写入重启回执。

## 最快测试卡片

在新会话发送：

> 使用 vibbit 插件内的 vibbit-skills，只测试内嵌数字人选人卡片。用两个明确标为演示的虚构人物展示卡片，不查询真实账号、不生成视频；我确认后只回报选中的 ID。

这项测试不需要业务 API Key。成功标准是会话内出现可交互卡片，选择并确认后对话收到正确 ID；工具 JSON、普通列表或独立网页不能代替内嵌卡片。部分宿主需要在确认后发送“继续”来处理回传上下文。

真实账号测试可发送：

> 使用 vibbit 插件内的 vibbit-skills，查询我的国内站数字人，用带封面的卡片让我选择，暂不生成视频。

## 环境与账号

- 本包只声明生产 MCP：`https://mcp.vibbit.cn/mcp`。测试入口 `https://demo.mcp.vibbit.cn/mcp` 不启用，也不自动回退。
- 业务 API 保留标准 Skill 的双站点：国内 `https://openapi.vibbit.cn/openapi/v1`、国际 `https://openapi.vibbit.ai/openapi/v1`。
- 复用用户已选站点；全新未配置账号沿用标准版的国际站默认值。中文聊天不自动切换国内站，使用国内账号时明确说明或指定 `--region cn`。
- 实际查询和生成使用正式业务凭据；MCP 展示服务不接收业务 Key。包内不包含任何账号凭据。
- 插件内 Skill 通过完整插件升级，不执行独立 `npx skills add` / `skills update` 来覆盖插件内容。

## 包结构与验证范围

根目录 `plugin.json`、`mcp.json` 为标准插件声明；`.codex-plugin/plugin.json`、`.mcp.json` 为兼容声明。`.agents/plugins/marketplace.json` 提供本地安装源，`skills/vibbit-skills/` 包含正式 Skill 与选人适配脚本。

保留已验证的 MCP 服务器字段 `type` 与 `url`，避免旧客户端因服务器 `extensions` 字段跳过服务。MCP 服务与卡片前端部署在远端，不包含在 ZIP 中。

协议连通、插件文件解析与原生 UI 交互是不同检查项。具体离线检查见维护记录；真实账号生成和桌面卡片显示、点击回传需安装后验证。

打包结构参考：[OpenAI 官方插件文档](https://developers.openai.com/plugins/build/plugins)。
