'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { readJson, files, run, findObject } = require('./common.cjs')
const pluginId = 'vibbit@vibbit-local'
const endpoint = 'https://mcp.vibbit.cn/mcp'

function validatePackage(root) {
  const manifest = readJson(path.join(root, 'plugin.json'))
  const version = manifest.version
  for (const name of ['.codex-plugin/plugin.json', '.codebuddy-plugin/plugin.json']) {
    const data = readJson(path.join(root, name))
    if (data.name !== 'vibbit' || data.version !== version || data.skills !== './skills/' || data.mcpServers !== './.mcp.json') throw new Error('插件清单或组件路径不一致')
  }
  if (manifest.name !== 'vibbit' || !/^\d+\.\d+\.\d+$/.test(version) || readJson(path.join(root, 'package.json')).version !== version || readJson(path.join(root, 'skills/vibbit-skills/package.json')).version !== version) throw new Error('插件、安装器与 Skill 版本不一致')
  for (const [name, type] of [['mcp.json', 'streamable-http'], ['.mcp.json', 'http']]) {
    const servers = readJson(path.join(root, name)).mcpServers
    const server = servers?.['vibbit-avatar-picker']
    if (Object.keys(servers || {}).length !== 1 || server?.type !== type || server.url !== endpoint || Object.keys(server).sort().join(',') !== 'type,url') throw new Error('MCP 生产端点或传输配置不匹配')
  }
  for (const [name, source] of [['.agents/plugins/marketplace.json', { source: 'local', path: './' }], ['.codebuddy-plugin/marketplace.json', './']]) {
    const catalog = readJson(path.join(root, name))
    if (catalog.name !== 'vibbit-local' || catalog.plugins?.length !== 1 || catalog.plugins[0].name !== 'vibbit' || JSON.stringify(catalog.plugins[0].source) !== JSON.stringify(source)) throw new Error('插件源声明不匹配')
  }
  for (const file of ['SKILL.md', 'scripts/vibbit.js', 'scripts/avatar-picker.js', 'agents/openai.yaml']) {
    if (!fs.statSync(path.join(root, 'skills/vibbit-skills', file)).isFile()) throw new Error(`缺少 Skill 文件：${file}`)
  }
  files(root)
  return version
}
function codexCli(explicit) {
  if (explicit) return explicit
  for (const candidate of [process.env.CODEX_APP_RUNTIME_CLI_PATH, '/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex', '/Applications/Codex.app/Contents/Resources/codex']) {
    if (candidate && fs.existsSync(candidate)) return candidate
  }
  return 'codex'
}
function workbuddyCli(explicit) {
  const candidates = explicit ? [explicit] : [process.env.WORKBUDDY_CLI_PATH,
    '/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy',
    path.join(os.homedir(), 'Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs/WorkBuddy/resources/app.asar.unpacked/cli/bin/codebuddy')].filter(Boolean)
  const cli = candidates.find(file => fs.existsSync(file) && fs.statSync(file).isFile())
  if (!cli) throw new Error('未找到 WorkBuddy 自带 CLI；可用 --workbuddy-cli 指定')
  return cli
}
function checkHost(host, opts) {
  if (host === 'codex') {
    const cli = codexCli(opts['codex-cli'])
    const version = run(cli, ['--version'], { timeout: 10000 })
    for (const args of [['plugin', 'marketplace', 'add', '--help'], ['plugin', 'add', '--help'], ['plugin', 'list', '--help']]) run(cli, args, { timeout: 10000 })
    return { host, cli, version }
  }
  const cli = workbuddyCli(opts['workbuddy-cli'])
  if (Number(process.versions.node.split('.')[0]) < 20) throw new Error('WorkBuddy 安装器需要 Node.js 20+')
  return { host, cli, configDir: path.resolve(opts['workbuddy-config'] || process.env.WORKBUDDY_CONFIG_DIR || path.join(os.homedir(), '.workbuddy')) }
}
function verifyCodex(cli, version) {
  const data = JSON.parse(run(cli, ['plugin', 'list', '--marketplace', 'vibbit-local', '--json']))
  const plugin = findObject(data, x => (x.pluginId === pluginId || x.id === pluginId || (x.name === 'vibbit' && x.marketplaceName === 'vibbit-local')) && typeof x.installed === 'boolean' && typeof x.enabled === 'boolean')
  if (!plugin?.installed || !plugin.enabled || plugin.version !== version) throw new Error('Codex 未确认正确版本已安装且启用')
  return { host: 'codex', pluginId, version, installed: true, enabled: true }
}
function verifyWorkbuddy(root, configDir, version) {
  const record = readJson(path.join(configDir, 'plugins/installed_plugins.json')).plugins?.[pluginId]
  const entry = (Array.isArray(record) ? record : record ? [record] : []).find(x => x.scope === 'user' && x.version === version)
  if (!entry?.installPath || !path.isAbsolute(entry.installPath)) throw new Error('WorkBuddy 未返回正确版本的安装记录')
  for (const file of files(root)) {
    if (!fs.readFileSync(path.join(root, file)).equals(fs.readFileSync(path.join(entry.installPath, file)))) throw new Error(`WorkBuddy 安装文件不匹配：${file}`)
  }
  if (readJson(path.join(configDir, 'settings.json')).enabledPlugins?.[pluginId] !== true) throw new Error('WorkBuddy 插件尚未启用')
  return { host: 'workbuddy', pluginId, version, installed: true, enabled: true, installedPath: entry.installPath }
}
function installHost(root, config, version, statusOnly = false) {
  if (config.host === 'codex') {
    if (!statusOnly) {
      run(config.cli, ['plugin', 'marketplace', 'add', root, '--json'], { cwd: root })
      const result = JSON.parse(run(config.cli, ['plugin', 'add', pluginId, '--json'], { cwd: root }))
      if (result.appsNeedingAuth?.length) throw new Error('Codex 返回待认证依赖，请按客户端提示处理')
    }
    return verifyCodex(config.cli, version)
  }
  if (!statusOnly) {
    const env = { ...process.env, CODEBUDDY_CONFIG_DIR: config.configDir, WORKBUDDY_CONFIG_DIR: config.configDir, CODEBUDDY_FORCE_LITE_WB_BUNDLE: '1' }
    for (const args of [['plugin', 'validate', root], ['plugin', 'marketplace', 'add', root], ['plugin', 'install', pluginId, '--scope', 'user'], ['plugin', 'enable', pluginId, '--scope', 'user']]) run(process.execPath, [config.cli, ...args], { cwd: root, env })
  }
  return verifyWorkbuddy(root, config.configDir, version)
}
module.exports = { validatePackage, checkHost, installHost, codexCli, workbuddyCli, pluginId, endpoint }
