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
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--host') {
      if (hostSeen || !['auto', 'codex', 'workbuddy', 'all'].includes(args[i + 1])) throw new Error('--host 只能指定一次：auto、codex、workbuddy 或 all')
      hostSeen = true
      host = args[++i]
    } else if (args[i] === '--no-restart') noRestart = true
    else forwarded.push(args[i])
  }
  if (noRestart && forwarded.includes('--restart')) throw new Error('--restart 与 --no-restart 不能同时使用')
  const opts = installer.options(['--host', host === 'auto' ? 'all' : host, ...forwarded])
  opts.host = host
  if (!noRestart && !opts.check && !opts.status && !opts.help && !opts['no-reload'] && !opts.restart) forwarded.push('--restart')
  return { opts, forwarded }
}

async function main(argv = process.argv.slice(2), deps = {}) {
  if (Number(process.versions.node.split('.')[0]) < 20) throw new Error('完整插件安装需要 Node.js 20+。')
  const root = deps.root || path.join(__dirname, '..', 'plugins', 'vibbit')
  const installer = deps.installer || require(path.join(root, 'install.cjs'))
  const hosts = deps.hosts || require(path.join(root, 'lib', 'hosts.cjs'))
  const log = deps.log || console.log
  if (argv.length === 1 && argv[0] === '--version') {
    log(`Vibbit 完整插件 ${hosts.validatePackage(root)}`)
    return 0
  }
  const { opts, forwarded } = parseArgs(argv, installer)
  if (opts.help) {
    log('用法：npx -y github:vibbit-ai/skills install [--host auto|codex|workbuddy|all]')
    log('默认自动检测已安装客户端；两者都有则一起安装 Skill + MCP。也可省略 install。')
    log('默认尝试刷新，必要时正常退出并重开客户端；请先结束活动任务。--no-restart 禁用重启兜底。')
    log('--check / --status：只读；--no-reload：只安装；--reload-only：重试刷新。')
    log('非标准位置：--codex-cli FILE --workbuddy-cli FILE；支持完整安装器的其他高级参数。')
    return 0
  }
  hosts.validatePackage(root)
  const selected = (deps.detectHosts || detectHosts)(opts)
  // Check all selected clients before the existing installer can write any profile.
  for (const client of selected) {
    try { hosts.checkHost(client.host, { ...opts, [`${client.host}-cli`]: client.cli }) }
    catch (error) { throw new Error(`已检测到 ${client.host}，但插件安装预检查未通过：${error.message}`) }
  }
  log(`检测到客户端：${selected.map(client => client.host).join(' + ')}；将安装完整 Skill + MCP。`)
  const args = ['--host', selected.length === 2 ? 'all' : selected[0].host, ...forwarded]
  for (const client of selected) args.push(`--${client.host}-cli`, client.cli)
  return installer.main(args)
}

if (require.main === module) main().then(code => { process.exitCode = code }, error => {
  console.error(`安装未完成：${error.message}`)
  process.exitCode = 1
})

module.exports = { main, parseArgs }
