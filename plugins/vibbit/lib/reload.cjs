'use strict'

const http = require('node:http')
const path = require('node:path')
const os = require('node:os')
const { spawn } = require('node:child_process')
const { run, findObject } = require('./common.cjs')
const { pluginId } = require('./hosts.cjs')

function localUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('刷新地址必须是本机 HTTP 根地址，不能包含凭据、查询参数或远程主机')
  // Avoid resolving localhost through an unexpected DNS/hosts configuration.
  if (url.hostname === 'localhost') url.hostname = '127.0.0.1'
  return url.origin
}
function requestJson(base, route, { method = 'GET', token, timeout = 5000 } = {}) {
  const origin = localUrl(base)
  return new Promise((resolve, reject) => {
    const headers = { 'X-CodeBuddy-Request': '1', Accept: 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    if (method === 'POST') headers['Content-Type'] = 'application/json'
    const req = http.request(origin + route, { method, headers }, res => {
      let body = '', size = 0
      res.on('data', chunk => {
        size += chunk.length
        if (size > 2 * 1024 * 1024) { req.destroy(new Error('HTTP_RESPONSE_LIMIT')); return }
        body += chunk
      })
      res.on('end', () => {
        // Never follow redirects with a local runtime credential.
        if (res.statusCode < 200 || res.statusCode >= 300) { reject(new Error(`HTTP_${res.statusCode}`)); return }
        try {
          const result = body.trim() ? JSON.parse(body) : {}
          if (result.error) { reject(new Error('HTTP_API_ERROR')); return }
          resolve(Object.hasOwn(result, 'data') ? result.data : result)
        } catch { reject(new Error('HTTP_INVALID_JSON')) }
      })
    })
    req.setTimeout(timeout, () => req.destroy(new Error('HTTP_TIMEOUT')))
    req.on('error', reject)
    req.end(method === 'POST' ? '{}' : undefined)
  })
}
function workbuddyEndpoints(configDir) {
  // The public HTTP API is used only on ports owned by the installed desktop
  // app. Never scan arbitrary localhost ports or read process environments.
  if (process.platform !== 'darwin' || path.resolve(configDir) !== path.join(os.homedir(), '.workbuddy')) return []
  let processes
  try { processes = run('/bin/ps', ['-axo', 'pid=,comm='], { timeout: 5000 }) } catch { return [] }
  const allCandidates = processes.split('\n').map(line => line.trim().match(/^(\d+)\s+(.+)$/)).filter(Boolean)
    .filter(([, , executable]) => /\/WorkBuddy\.app\/Contents\/(MacOS\/Electron|Resources\/.*\/node)$/.test(executable))
  const candidates = allCandidates.slice(0, 12)
  const endpoints = new Set()
  for (const [, pid] of candidates) {
    try {
      const listing = run('/usr/sbin/lsof', ['-n', '-P', '-a', '-p', pid, '-iTCP', '-sTCP:LISTEN', '-Fn'], { timeout: 3000 })
      for (const line of listing.split('\n')) {
        const match = line.match(/^n(127\.0\.0\.1|\[::1\]):(\d+)$/)
        if (match) endpoints.add(`http://${match[1]}:${match[2]}`)
      }
    } catch { /* The process may have no listening socket or may have exited. */ }
  }
  return Object.assign([...endpoints].slice(0, 12), { truncated: allCandidates.length > 12 || endpoints.size > 12 })
}
function isInstalledPlugin(value, version) {
  const identity = value.pluginId === pluginId || value.id === pluginId || value.fullName === pluginId ||
    (value.name === 'vibbit' && [value.marketplace, value.marketplaceName].includes('vibbit-local'))
  const enabled = typeof value.enabled === 'boolean' ? value.enabled : value.status === 'enabled'
  return identity && (value.localVersion || value.version) === version && enabled
}
async function reloadWorkbuddy(config, opts, version, deps = {}) {
  const discover = deps.discover || workbuddyEndpoints
  const request = deps.request || requestJson
  const endpoints = opts['workbuddy-url'] ? [localUrl(opts['workbuddy-url'])] : discover(config.configDir)
  const token = (deps.env || process.env).CODEBUDDY_GATEWAY_PASSWORD
  let last = 'no_running_endpoint'
  let refreshed = 0, failed = false
  for (const endpoint of endpoints) {
    let recognized = false
    try {
      // Probe without sending credentials. The app process owns this endpoint,
      // or the operator explicitly selected it with --workbuddy-url.
      let health
      try { health = await request(endpoint, '/api/v1/health') }
      catch (error) {
        if (error.message !== 'HTTP_401' || !token) throw error
        health = await request(endpoint, '/api/v1/health', { token })
      }
      if (!health || health.status !== 'ok') { last = 'health_not_ready'; continue }
      recognized = true
      await request(endpoint, '/api/v1/plugins', { token })
      await request(endpoint, '/api/v1/plugins/reload', { method: 'POST', token, timeout: 15000 })
      const plugins = await request(endpoint, '/api/v1/plugins', { token })
      if (!findObject(plugins, item => isInstalledPlugin(item, version))) {
        failed = true; last = 'runtime_plugin_version_not_verified'
      } else refreshed++
    } catch (error) {
      last = /^HTTP_\d+$/.test(error.message) ? error.message : 'runtime_unavailable'
      if (recognized || !['HTTP_404', 'HTTP_405'].includes(last)) failed = true
    }
  }
  if (refreshed && !failed && !endpoints.truncated) return { state: 'reloaded', activeClientVerified: true, mechanism: 'workbuddy_http_api', runtimesRefreshed: refreshed, trust: 'not_verified', tools: 'not_verified' }
  return { state: refreshed ? 'partially_reloaded' : 'pending', activeClientVerified: false, reason: endpoints.truncated ? 'runtime_discovery_limit' : last, runtimesRefreshed: refreshed, trust: 'not_verified' }
}

class RpcClient {
  constructor(cli, args, options = {}) {
    this.pending = new Map()
    this.nextId = 1
    this.buffer = ''
    this.closed = false
    this.process = spawn(cli, args, { stdio: ['pipe', 'pipe', 'pipe'], shell: false, windowsHide: true, ...options })
    this.process.stderr.on('data', () => {})
    this.process.stdout.on('data', chunk => {
      this.buffer += chunk
      if (Buffer.byteLength(this.buffer) > 8 * 1024 * 1024) { this.close(new Error('RPC_RESPONSE_LIMIT')); return }
      let index
      while ((index = this.buffer.indexOf('\n')) >= 0) {
        const line = this.buffer.slice(0, index); this.buffer = this.buffer.slice(index + 1)
        let message
        try { message = JSON.parse(line) } catch { continue }
        const item = this.pending.get(message.id)
        if (!item) continue
        this.pending.delete(message.id); clearTimeout(item.timer)
        if (message.error) item.reject(new Error(`RPC_ERROR_${message.error.code}`))
        else if (Object.hasOwn(message, 'result')) item.resolve(message.result)
        else item.reject(new Error('RPC_INVALID_RESPONSE'))
      }
    })
    this.process.on('error', () => this.close(new Error('RPC_UNAVAILABLE')))
    this.process.on('exit', () => this.close(new Error('RPC_CLOSED')))
    this.process.stdin.on('error', () => this.close(new Error('RPC_CLOSED')))
  }
  request(method, params, timeout = 8000) {
    if (this.closed) return Promise.reject(new Error('RPC_CLOSED'))
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('RPC_TIMEOUT')) }, timeout)
      this.pending.set(id, { resolve, reject, timer })
      this.process.stdin.write(JSON.stringify({ id, method, ...(params === undefined ? {} : { params }) }) + '\n')
    })
  }
  notify(method) { if (!this.closed) this.process.stdin.write(JSON.stringify({ method }) + '\n') }
  close(reason = new Error('RPC_CLOSED')) {
    if (this.closed) return
    this.closed = true
    for (const item of this.pending.values()) { clearTimeout(item.timer); item.reject(reason) }
    this.pending.clear()
    this.process.stdin.destroy()
    // This is our stdio proxy, never the user's app-server or desktop process.
    this.process.kill()
  }
}
async function reloadCodex(config, opts, version, deps = {}) {
  const env = deps.env || process.env
  const args = ['app-server', 'proxy', ...(opts['codex-socket'] ? ['--sock', opts['codex-socket']] : [])]
  const client = deps.client || new RpcClient(config.cli, args)
  try {
    await client.request('initialize', { clientInfo: { name: 'vibbit-installer', version }, capabilities: { experimentalApi: true } }, 5000)
    client.notify('initialized')
    // A separate temporary app-server would not reload the desktop. Only use
    // the existing proxy transport and verify scope before claiming success.
    const loaded = await client.request('thread/loaded/list', {})
    const current = env.CODEX_THREAD_ID || env.CODEX_SESSION_ID
    const sameClient = Boolean(opts['codex-socket'] || (current && loaded.data?.includes(current)))
    if (!sameClient) return { state: 'pending', activeClientVerified: false, reason: 'desktop_runtime_not_identified' }
    await client.request('plugin/reconcile', { reason: 'vibbit-installer' }, 15000)
    await client.request('skills/list', { cwds: [opts.cwd || process.cwd()], forceReload: true })
    await client.request('config/mcpServer/reload', undefined, 15000)
    const installed = await client.request('plugin/installed', { cwds: [opts.cwd || process.cwd()] })
    if (!findObject(installed, item => isInstalledPlugin(item, version))) return { state: 'reload_requested', activeClientVerified: false, reason: 'runtime_plugin_version_not_verified' }
    return { state: 'reloaded', activeClientVerified: true, mechanism: 'codex_existing_app_server', tools: 'refresh_queued' }
  } catch { return { state: 'pending', activeClientVerified: false, reason: 'existing_app_server_unavailable' } }
  finally { client.close() }
}
module.exports = { localUrl, requestJson, workbuddyEndpoints, isInstalledPlugin, RpcClient, reloadCodex, reloadWorkbuddy }
