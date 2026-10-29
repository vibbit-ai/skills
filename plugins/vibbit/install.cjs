#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { readJson, writeJson, stableCopy } = require('./lib/common.cjs')
const { validatePackage, checkHost, installHost } = require('./lib/hosts.cjs')
const { reloadCodex, reloadWorkbuddy, localUrl } = require('./lib/reload.cjs')

function options(argv) {
  const opts = { host: 'all', cwd: process.cwd() }
  const values = ['host', 'codex-cli', 'workbuddy-cli', 'workbuddy-config', 'codex-socket', 'workbuddy-url', 'store']
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i].replace(/^--/, '')
    if (!argv[i].startsWith('--')) throw new Error(`未知参数：${argv[i]}`)
    if (['check', 'status', 'reload-only', 'no-reload', 'restart', 'help'].includes(name)) opts[name] = true
    else if (values.includes(name) && argv[i + 1] && !argv[i + 1].startsWith('--')) opts[name] = argv[++i]
    else if (name === 'cli' && argv[i + 1] && !argv[i + 1].startsWith('--') && opts.host !== 'all') opts[`${opts.host}-cli`] = argv[++i]
    else throw new Error(`未知或不完整参数：${argv[i]}`)
  }
  if (!['all', 'codex', 'workbuddy'].includes(opts.host)) throw new Error('--host 必须是 codex、workbuddy 或 all')
  if ([opts.check, opts.status, opts['reload-only']].filter(Boolean).length > 1 || (opts['no-reload'] && (opts.restart || opts['reload-only']))) throw new Error('检查/状态/仅刷新选项互斥，--no-reload 不能与刷新或重启组合')
  if (opts['workbuddy-url']) opts['workbuddy-url'] = localUrl(opts['workbuddy-url'])
  for (const key of ['store', 'workbuddy-config', 'codex-socket']) if (opts[key]) opts[key] = path.resolve(opts[key])
  return opts
}
async function refresh(configs, reports, opts, version, root, reportPath) {
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i]
    console.log(`正在刷新 ${config.host}…`)
    reports[i].reload = await (config.host === 'codex' ? reloadCodex(config, opts, version) : reloadWorkbuddy(config, opts, version))
    writeJson(reportPath, { version, hosts: reports, nativeCardInteraction: 'not_verified' })
  }
  const pending = reports.filter(item => !item.reload.activeClientVerified).map(item => item.host)
  if (!pending.length) return
  // WorkBuddy goes first when both are selected, preserving a running Codex
  // installation session until the other host has been handled.
  pending.sort((a, b) => Number(a === 'codex') - Number(b === 'codex'))
  const requestPath = reportPath.replace(/\.json$/, '-restart-request.json')
  const resultPath = reportPath.replace(/\.json$/, '-restart-result.json')
  writeJson(requestPath, { hosts: pending, allowRestart: !!opts.restart, resultPath })
  console.log(`刷新/重启回执：${resultPath}`)
  const child = spawn(process.execPath, [path.join(root, 'lib/restart-worker.cjs'), requestPath], { detached: true, stdio: 'ignore', windowsHide: true, shell: false })
  let failed = false
  child.once('error', () => { failed = true })
  child.unref()
  for (let i = 0; i < 150 && !failed; i++) {
    if (fs.existsSync(resultPath)) {
      const result = readJson(resultPath)
      if (result.done) {
        for (const entry of result.results) reports.find(item => item.host === entry.host).reload.restart = entry
        return
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  // The detached worker keeps its receipt even if the calling app exits.
  for (const item of reports.filter(item => pending.includes(item.host))) item.reload.restart = { state: 'pending', reason: failed ? 'worker_start_failed' : 'worker_result_pending', resultPath }
}
async function main(argv = process.argv.slice(2)) {
  const opts = options(argv)
  if (opts.help) {
    console.log('用法：node install.cjs --host codex|workbuddy|all [--restart] [--check | --status | --reload-only] [--no-reload]')
    console.log('--restart：热重载不可用时允许正常退出并重新打开客户端；请先结束正在运行的任务。不会强制结束进程。')
    console.log('--check / --status：只读检查；--reload-only：核对当前安装版本后重试刷新。')
    console.log('高级参数：--codex-cli FILE --workbuddy-cli FILE --workbuddy-config DIR --codex-socket FILE --workbuddy-url http://127.0.0.1:PORT --store DIR')
    return 0
  }
  if (Number(process.versions.node.split('.')[0]) < 18) throw new Error('需要 Node.js 18+；安装 WorkBuddy 需要 Node.js 20+')
  const source = __dirname
  const version = validatePackage(source)
  const hosts = opts.host === 'all' ? ['codex', 'workbuddy'] : [opts.host]
  // Preflight every selected host before making any installation change.
  const configs = hosts.map(host => checkHost(host, opts))
  if (opts.check) { console.log(`检查通过：Vibbit ${version} · ${hosts.join(' + ')}；尚未安装或刷新客户端。`); return 0 }
  if (opts.status) {
    const reports = configs.map(config => installHost(source, config, version, true))
    console.log(JSON.stringify({ version, hosts: reports, runtimeLoading: 'not_verified' }, null, 2)); return 0
  }
  if (opts.restart) console.log('已启用自动重启兜底：热重载不可用时将请求客户端正常退出并重新打开；请先结束正在运行的任务。')
  const store = opts.store || path.join(os.homedir(), '.vibbit-installer')
  const root = stableCopy(source, store, version)
  const reportPath = path.join(store, 'reports', `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}.json`)
  const reports = []
  console.log(`持久安装来源：${root}`)
  console.log(`安装报告：${reportPath}`)
  for (const config of configs) {
    console.log(`${opts['reload-only'] ? '核对' : '安装'} ${config.host}…`)
    const report = installHost(root, config, version, !!opts['reload-only'])
    reports.push({ ...report, reload: { state: 'not_attempted' }, trust: 'not_verified', nativeCardInteraction: 'not_verified' })
    writeJson(reportPath, { version, hosts: reports, nativeCardInteraction: 'not_verified' })
    console.log(`安装并启用成功（文件与配置）：${config.host} · ${version}`)
  }
  if (!opts['no-reload']) await refresh(configs, reports, opts, version, root, reportPath)
  writeJson(reportPath, { version, hosts: reports, nativeCardInteraction: 'not_verified' })
  for (const report of reports) {
    const restart = report.reload.restart?.state
    const state = report.reload.activeClientVerified ? '已请求实际运行时重新加载' : ['restarted', 'started'].includes(restart) ? '客户端已重新启动，待会话确认工具可用' : opts['no-reload'] ? '已按参数跳过刷新' : '安装完成，刷新尚未完成'
    console.log(`${report.host}：${state}。`)
  }
  console.log('若 WorkBuddy 首次显示 MCP 未信任，请在客户端确认；安装器不会改写信任记录。卡片显示和点击回传仍需会话验证。')
  console.log('测试：使用 vibbit 插件内的 vibbit-skills，只展示数字人选择卡片，暂不生成视频。')
  const pending = reports.some(report => !report.reload.activeClientVerified && !['restarted', 'started'].includes(report.reload.restart?.state))
  if (pending && !opts['no-reload']) console.log('可在任务结束后用同一命令加 --restart --reload-only 重试；完整原因见安装报告。')
  return pending && !opts['no-reload'] ? 2 : 0
}
if (require.main === module) main().then(code => { process.exitCode = code }, error => { console.error(`安装未完成：${error.message}`); process.exitCode = 1 })
module.exports = { main, options, refresh }
