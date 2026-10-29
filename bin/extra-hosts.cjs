'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')

const pluginId = 'vibbit'
const claudeId = 'vibbit@vibbit-local'
const serverId = 'vibbit-avatar-picker'
const endpoint = 'https://mcp.vibbit.cn/mcp'

function cliRunner(cli, run) {
  if (/\.(cmd|bat)$/i.test(cli)) throw new Error('请指定客户端可执行文件或 JavaScript 入口，不能使用 .cmd/.bat 包装脚本。')
  return args => /\.(?:cjs|mjs|js)$/i.test(cli)
    ? run(process.execPath, [cli, ...args])
    : run(cli, args)
}

function checkHost(host, opts, common) {
  const cli = opts[`${host}-cli`]
  const run = cliRunner(cli, common.run)
  const version = run(['--version'])
  const requireHelp = (args, fields) => {
    const help = run([...args, '--help'])
    for (const field of fields) if (!help.includes(field)) throw new Error(`${host} 缺少 ${args.join(' ')} ${field}，请先升级客户端。`)
  }
  if (host === 'claude') {
    requireHelp(['plugin', 'marketplace', 'add'], ['--scope'])
    requireHelp(['plugin', 'install'], ['--scope'])
    requireHelp(['plugin', 'update'], ['--scope'])
    requireHelp(['plugin', 'enable'], ['--scope'])
    requireHelp(['plugin', 'list'], ['--json'])
    requireHelp(['plugin', 'validate'], [])
  } else if (host === 'openclaw') {
    requireHelp(['plugins', 'install'], ['--force', '--accept-capabilities'])
    requireHelp(['plugins', 'enable'], ['--accept-capabilities'])
    requireHelp(['plugins', 'inspect'], ['--json'])
    requireHelp(['plugins', 'reload'], ['--json'])
  } else throw new Error(`不支持的客户端：${host}`)
  return { host, cli, run, cliVersion: version }
}

function prepareBundle(source, store, version, common) {
  // The published release stays byte-identical. These are host-specific wrappers
  // around exactly the same Skill and production MCP configuration.
  const stagingRoot = path.join(store, 'host-adapters')
  fs.mkdirSync(stagingRoot, { recursive: true, mode: 0o700 })
  const temp = fs.mkdtempSync(path.join(stagingRoot, '.staging-'))
  try {
    fs.cpSync(path.join(source, 'skills'), path.join(temp, 'skills'), { recursive: true })
    fs.copyFileSync(path.join(source, '.mcp.json'), path.join(temp, '.mcp.json'))
    common.writeJson(path.join(temp, '.claude-plugin', 'plugin.json'), {
      name: pluginId, version,
      description: 'Vibbit content creation Skill with an interactive digital-human picker',
      author: { name: 'Vibbit' }, skills: './skills/', mcpServers: './.mcp.json',
    })
    common.writeJson(path.join(temp, '.claude-plugin', 'marketplace.json'), {
      name: 'vibbit-local', owner: { name: 'Vibbit' },
      plugins: [{ name: pluginId, source: './', version }],
    })
    const contents = JSON.stringify(common.inventory(temp))
    const digest = crypto.createHash('sha256').update(contents).digest('hex').slice(0, 20)
    const destination = path.join(stagingRoot, 'packages', version, digest)
    if (fs.existsSync(destination)) {
      if (JSON.stringify(common.inventory(destination)) !== contents) throw new Error('持久安装来源已被修改，请保留现场检查')
    } else {
      fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 })
      fs.renameSync(temp, destination)
    }
    return destination
  } finally { if (fs.existsSync(temp)) fs.rmSync(temp, { recursive: true, force: true }) }
}

function prepareBase(source, opts, version, common) {
  const store = opts.store || path.join(os.homedir(), '.vibbit-installer')
  const contents = JSON.stringify(common.inventory(source))
  const digest = crypto.createHash('sha256').update(contents).digest('hex').slice(0, 20)
  const destination = path.join(store, 'packages', version, digest)
  if (fs.existsSync(destination)) {
    if (JSON.stringify(common.inventory(destination)) !== contents) throw new Error('持久安装来源已被修改，请保留现场检查')
    return destination
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 })
  const staging = fs.mkdtempSync(path.join(path.dirname(destination), '.staging-'))
  try {
    // Node 24 rejects cpSync(errorOnExist) into the mkdtemp directory itself.
    // Seed the unchanged release installer's cache using a new child directory.
    const copy = path.join(staging, 'package')
    fs.cpSync(source, copy, { recursive: true, errorOnExist: true, force: false })
    if (JSON.stringify(common.inventory(copy)) !== contents) throw new Error('持久安装来源复制校验失败')
    fs.renameSync(copy, destination)
    return destination
  } finally { fs.rmSync(staging, { recursive: true, force: true }) }
}

function verifyPayload(source, installed, version, common) {
  const manifest = common.readJson(path.join(installed, '.claude-plugin', 'plugin.json'))
  if (manifest.name !== pluginId || manifest.version !== version || manifest.skills !== './skills/' || manifest.mcpServers !== './.mcp.json') throw new Error('已安装插件的版本或 Skill/MCP 声明不匹配')
  const mcp = common.readJson(path.join(installed, '.mcp.json'))
  if (mcp.mcpServers?.[serverId]?.url !== endpoint || mcp.mcpServers[serverId].type !== 'http') throw new Error('已安装 MCP 配置不匹配')
  if (!fs.readFileSync(path.join(source, '.mcp.json')).equals(fs.readFileSync(path.join(installed, '.mcp.json')))) throw new Error('已安装 MCP 文件与发行包不同')
  const expected = common.inventory(path.join(source, 'skills'))
  const actual = common.inventory(path.join(installed, 'skills'))
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error('已安装 Skill 文件与发行包不同')
}

function verifyHost(source, config, version, common) {
  let installed
  if (config.host === 'claude') {
    const list = JSON.parse(config.run(['plugin', 'list', '--json']))
    if (!Array.isArray(list)) throw new Error('Claude Code 返回了未知的插件清单格式')
    const entry = list.find(item => item.id === claudeId && item.scope === 'user')
    if (!entry?.enabled || entry.version !== version || !entry.installPath) throw new Error(`Claude Code 尚未在 user 范围启用 ${claudeId} ${version}`)
    installed = entry.installPath
  } else {
    const info = JSON.parse(config.run(['plugins', 'inspect', pluginId, '--json']))
    if (info.plugin?.id !== pluginId || info.plugin.enabled !== true || info.plugin.version !== version || info.plugin.status === 'error') throw new Error(`OpenClaw 尚未启用 ${pluginId} ${version}`)
    if (!info.mcpServers?.some(server => server.name === serverId && !server.unsupported)) throw new Error('此 OpenClaw 版本没有识别插件中的 HTTP MCP，请先升级 OpenClaw。')
    installed = info.install?.installPath
    if (!installed) throw new Error('OpenClaw 没有返回可验证的插件安装目录')
  }
  verifyPayload(source, installed, version, common)
  return { host: config.host, version, installedPath: installed, filesVerified: true, enabled: true, mcpConfigured: true }
}

async function installHost(source, config, version, opts, common, log = console.log) {
  if (opts.check) { log(`${config.host}：安装预检查通过，未写入客户端配置。`); return 0 }
  if (opts.status) {
    log(JSON.stringify({ ...verifyHost(source, config, version, common), runtimeLoading: 'not_verified' }, null, 2))
    return 0
  }
  const store = opts.store || path.join(os.homedir(), '.vibbit-installer')
  if (!opts['reload-only']) {
    const bundle = prepareBundle(source, store, version, common)
    if (config.host === 'claude') {
      config.run(['plugin', 'validate', bundle])
      config.run(['plugin', 'marketplace', 'add', bundle, '--scope', 'user'])
      config.run(['plugin', 'install', claudeId, '--scope', 'user'])
      config.run(['plugin', 'update', claudeId, '--scope', 'user'])
      const list = JSON.parse(config.run(['plugin', 'list', '--json']))
      if (!Array.isArray(list)) throw new Error('Claude Code 返回了未知的插件清单格式')
      if (!list.some(item => item.id === claudeId && item.scope === 'user' && item.enabled)) config.run(['plugin', 'enable', claudeId, '--scope', 'user'])
    } else {
      log('OpenClaw：安装 Vibbit Skill，并登记生产 MCP https://mcp.vibbit.cn/mcp。')
      // Consent is limited to this reviewed bundle's declared Skill + MCP.
      // Never disable install policy, acknowledge security warnings, or edit trust records.
      config.run(['plugins', 'install', bundle, '--force', '--accept-capabilities'])
      config.run(['plugins', 'enable', pluginId, '--accept-capabilities'])
    }
  }
  const report = { ...verifyHost(source, config, version, common), runtimeLoading: 'not_verified', reload: { state: 'not_attempted' } }
  let code = 0
  if (!opts['no-reload']) {
    if (config.host === 'claude') {
      report.reload = { state: 'new_session_required', reason: 'no_external_session_reload_api' }
      log('Claude Code：Skill + MCP 已安装并启用。新会话自动加载；当前会话可运行 /reload-plugins。')
      code = 2
    } else {
      try {
        const result = JSON.parse(config.run(['plugins', 'reload', pluginId, '--json']))
        if (!Number.isInteger(result.runtime?.generation) || result.restartRequired) throw new Error('Gateway 没有确认插件运行时已刷新')
        report.reload = { state: 'reloaded', generation: result.runtime.generation }
        log('OpenClaw：Skill + MCP 已安装并启用，Gateway 已确认插件刷新。')
      } catch (error) {
        report.reload = { state: 'pending', reason: error.message }
        log('OpenClaw：Skill + MCP 已安装并启用；当前 Gateway 尚未确认刷新，启动 Gateway 后会加载。可加 --host openclaw --reload-only 重试。')
        code = 2
      }
    }
  } else log(`${config.host}：Skill + MCP 已安装并启用，已跳过额外刷新。`)
  const reportPath = path.join(store, 'reports', `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}-${config.host}.json`)
  common.writeJson(reportPath, report)
  log(`安装报告：${reportPath}`)
  return code
}

module.exports = { checkHost, prepareBundle, prepareBase, verifyPayload, verifyHost, installHost, cliRunner }
