'use strict'

const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { run } = require('./common.cjs')

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
function findApp(host, platform = process.platform) {
  const names = host === 'codex' ? ['ChatGPT', 'Codex'] : ['WorkBuddy']
  if (platform === 'darwin') {
    for (const name of names) for (const dir of ['/Applications', path.join(os.homedir(), 'Applications')]) {
      const candidate = path.join(dir, name + '.app')
      if (fs.existsSync(path.join(candidate, 'Contents/Info.plist'))) return candidate
    }
  }
  if (platform === 'win32') {
    for (const name of names) for (const base of [process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs'), process.env.ProgramFiles].filter(Boolean)) {
      const candidate = path.join(base, name, name + '.exe')
      if (fs.existsSync(candidate)) return candidate
    }
  }
  return null
}
function macRunning(executable, execute) {
  return execute('/bin/ps', ['-axo', 'comm='], { timeout: 5000 }).split('\n').some(line => line.trim() === executable)
}
async function restartApp(host, allowRestart, deps = {}) {
  if (!['codex', 'workbuddy'].includes(host)) throw new Error('Unknown host')
  const platform = deps.platform || process.platform
  const execute = deps.run || run
  const sleep = deps.sleep || delay
  const app = (deps.findApp || findApp)(host, platform)
  if (!app) return { host, state: 'pending', reason: 'desktop_app_not_found' }
  if (platform === 'darwin') {
    const info = path.join(app, 'Contents/Info.plist')
    const id = execute('/usr/bin/plutil', ['-extract', 'CFBundleIdentifier', 'raw', '-o', '-', info])
    const binary = execute('/usr/bin/plutil', ['-extract', 'CFBundleExecutable', 'raw', '-o', '-', info])
    if (!/^[A-Za-z0-9.-]+$/.test(id) || !binary || binary.includes('/') || binary.includes('..')) throw new Error('应用信息无效')
    const executable = path.join(app, 'Contents/MacOS', binary)
    const wasRunning = macRunning(executable, execute)
    if (wasRunning && !allowRestart) return { host, state: 'pending', reason: 'restart_requires_option' }
    if (wasRunning) {
      // Standard quit allows the app to save or refuse. Never force-kill it.
      execute('/usr/bin/osascript', ['-e', `tell application id "${id}" to quit`], { timeout: 35000 })
      let stopped = false
      for (let i = 0; i < 30; i++) {
        if (!macRunning(executable, execute)) { stopped = true; break }
        await sleep(500)
      }
      if (!stopped) return { host, state: 'pending', reason: 'app_did_not_quit' }
    }
    execute('/usr/bin/open', ['-a', app], { timeout: 10000 })
    for (let i = 0; i < 20; i++) {
      if (macRunning(executable, execute)) return { host, state: wasRunning ? 'restarted' : 'started', mechanism: 'normal_app_launch', tools: 'not_verified', trust: 'not_verified' }
      await sleep(500)
    }
    return { host, state: 'pending', reason: 'launch_not_confirmed' }
  }
  if (platform === 'win32') {
    // The path is data in an environment variable, never interpolated as code.
    const script = "$ErrorActionPreference='Stop'; $appPath=$env:VIBBIT_RESTART_APP; $p=@(Get-Process | Where-Object { $_.Path -eq $appPath }); $wasRunning=$p.Count -gt 0; if ($wasRunning -and $env:VIBBIT_RESTART_ALLOWED -ne '1') { @{state='pending';reason='restart_requires_option'} | ConvertTo-Json -Compress; exit 0 }; foreach ($item in $p) { if (-not $item.CloseMainWindow() -or -not $item.WaitForExit(30000)) { @{state='pending';reason='app_did_not_quit'} | ConvertTo-Json -Compress; exit 0 } }; Start-Process -FilePath $appPath; for ($i=0;$i -lt 20;$i++) { if (@(Get-Process | Where-Object { $_.Path -eq $appPath }).Count -gt 0) { $state=if($wasRunning){'restarted'}else{'started'}; @{state=$state;tools='not_verified';trust='not_verified'} | ConvertTo-Json -Compress; exit 0 }; Start-Sleep -Milliseconds 500 }; @{state='pending';reason='launch_not_confirmed'} | ConvertTo-Json -Compress"
    const result = execute('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { timeout: 60000, env: { ...process.env, VIBBIT_RESTART_APP: app, VIBBIT_RESTART_ALLOWED: allowRestart ? '1' : '0' } })
    return { host, ...JSON.parse(result) }
  }
  return { host, state: 'pending', reason: 'platform_restart_not_supported' }
}
module.exports = { findApp, restartApp }
