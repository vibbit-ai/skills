#!/usr/bin/env node
'use strict'

const path = require('node:path')
const { detectHosts } = require('./detect-hosts.cjs')

function parseArgs(argv, installer) {
  const args = [...argv]
  if (args[0] && !args[0].startsWith('--')) {
    if (args.shift() !== 'install') throw new Error('支持的命令：install。使用 --help 查看说明。')
  }
  const forwarded = []
  let host = 'auto'
  let hostSeen = false
  let noRestart = false
  const extraOptions = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--host') {
      if (hostSeen || !['auto', 'codex', 'workbuddy', 'claude', 'openclaw', 'all'].includes(args[i + 1])) throw new Error('--host 只能指定一次：auto、codex、workbuddy、claude、openclaw 或 all')
      hostSeen = true
      host = args[++i]
    } else if (['--claude-cli', '--openclaw-cli'].includes(args[i])) {
      const key = args[i].slice(2)
      if (extraOptions[key] || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`参数不完整或重复：--${key}`)
      extraOptions[key] = args[++i]
    } else if (args[i] === '--no-restart') noRestart = true
    else forwarded.push(args[i])
  }
  if (noRestart && forwarded.includes('--restart')) throw new Error('--restart 与 --no-restart 不能同时使用')
  const opts = installer.options(['--host', ['codex', 'workbuddy'].includes(host) ? host : 'all', ...forwarded])
  opts.host = host
  Object.assign(opts, extraOptions)
  if (!noRestart && !opts.check && !opts.status && !opts.help && !opts['no-reload'] && !opts.restart) forwarded.push('--restart')
  return { opts, forwarded }
}

async function main(argv = process.argv.slice(2), deps = {}) {
  if (Number(process.versions.node.split('.')[0]) < 20) throw new Error('完整插件安装需要 Node.js 20+。')
  const root = deps.root || path.join(__dirname, '..', 'plugins', 'vibbit')
  const installer = deps.installer || require(path.join(root, 'install.cjs'))
  const hosts = deps.hosts || require(path.join(root, 'lib', 'hosts.cjs'))
  const extraHosts = deps.extraHosts || require('./extra-hosts.cjs')
  const common = deps.common || require(path.join(root, 'lib', 'common.cjs'))
  const log = deps.log || console.log
  if (argv.length === 1 && argv[0] === '--version') {
    log(`Vibbit 完整插件 ${hosts.validatePackage(root)}`)
    return 0
  }
  const { opts, forwarded } = parseArgs(argv, installer)
  if (opts.help) {
    log('用法：npx -y vibbit-ai/skills install [--host auto|codex|workbuddy|claude|openclaw|all]')
    log('默认检测 Codex、WorkBuddy、Claude Code 和 OpenClaw，为找到的客户端一起安装最新版 Skill + MCP。')
    log('Codex / WorkBuddy 默认尝试刷新或正常重启；OpenClaw 请求 Gateway 刷新；Claude Code 新会话加载。')
    log('请先结束活动任务。--no-restart 禁用 Codex / WorkBuddy 的重启兜底。客户端信任仍遵循其自身规则。')
    log('--check / --status：只读；--no-reload：只安装；--reload-only：重试刷新。')
    log('非标准位置：--codex-cli FILE --workbuddy-cli FILE --claude-cli FILE --openclaw-cli FILE。')
    log('--host all 要求四种客户端都存在；默认 auto 只安装找到的客户端，其他 Agent 暂不支持自动注册。')
    return 0
  }
  const version = hosts.validatePackage(root)
  const selected = (deps.detectHosts || detectHosts)(opts)
  const extraConfigs = []
  // Check all selected clients before the existing installer can write any profile.
  for (const client of selected) {
    try {
      const hostOptions = { ...opts, [`${client.host}-cli`]: client.cli }
      if (['claude', 'openclaw'].includes(client.host)) extraConfigs.push(extraHosts.checkHost(client.host, hostOptions, common))
      else hosts.checkHost(client.host, hostOptions)
    }
    catch (error) { throw new Error(`已检测到 ${client.host}，但插件安装预检查未通过：${error.message}`) }
  }
  log(`检测到客户端：${selected.map(client => client.host).join(' + ')}；将安装完整 Skill + MCP。`)
  let code = 0
  // Complete these installs before Codex/WorkBuddy may restart the calling app.
  for (const config of extraConfigs) code = Math.max(code, await extraHosts.installHost(root, config, version, opts, common, log))
  const legacy = selected.filter(client => ['codex', 'workbuddy'].includes(client.host))
  if (legacy.length) {
    if (!opts.check && !opts.status) extraHosts.prepareBase(root, opts, version, common)
    const args = ['--host', legacy.length === 2 ? 'all' : legacy[0].host, ...forwarded]
    for (const client of legacy) args.push(`--${client.host}-cli`, client.cli)
    code = Math.max(code, await installer.main(args))
  }
  return code
}

if (require.main === module) main().then(code => { process.exitCode = code }, error => {
  console.error(`安装未完成：${error.message}`)
  process.exitCode = 1
})

module.exports = { main, parseArgs }
