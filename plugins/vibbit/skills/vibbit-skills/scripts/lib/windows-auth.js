'use strict'

const { execFile } = require('node:child_process')
const { existsSync } = require('node:fs')
const path = require('node:path')

function powershellPath() {
  const root = process.env.SystemRoot
  return root && path.win32.isAbsolute(root)
    ? path.win32.join(root, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
    : undefined
}

function available() {
  const file = powershellPath()
  return !!file && existsSync(file)
}

function run(script, input) {
  return new Promise((resolve, reject) => {
    const file = powershellPath()
    const error = () => new Error('Windows could not access the current user’s local credential setup')
    if (!file) { reject(error()); return }
    const command = Buffer.from("$ErrorActionPreference = 'Stop'\n" + script, 'utf16le').toString('base64')
    const child = execFile(file, ['-NoProfile', '-NonInteractive', '-EncodedCommand', command],
      { timeout: 10000, maxBuffer: 32768, windowsHide: true }, (failure, stdout) => {
        if (failure) reject(error())
        else resolve(stdout.trim())
      })
    child.stdin.on('error', () => {})
    child.stdin.end(input)
  })
}

async function transform(input, method) {
  const script = `Add-Type -AssemblyName System.Security
$bytes = [Convert]::FromBase64String([Console]::In.ReadToEnd())
$scope = [Security.Cryptography.DataProtectionScope]::CurrentUser
$result = [Security.Cryptography.ProtectedData]::${method}($bytes, $null, $scope)
[Console]::Out.Write([Convert]::ToBase64String($result))`
  const result = await run(script, input)
  if (!result || Buffer.from(result, 'base64').toString('base64') !== result) throw new Error('Invalid Windows credential data')
  return result
}

async function protect(text) {
  return transform(Buffer.from(text, 'utf8').toString('base64'), 'Protect')
}

async function unprotect(encoded) {
  return Buffer.from(await transform(encoded, 'Unprotect'), 'base64').toString('utf8')
}

async function openSetupPage(url) {
  if (!/^http:\/\/127\.0\.0\.1:\d{1,5}\/[A-Za-z0-9_-]{43}\/$/.test(url)) throw new Error('Invalid local setup URL')
  await run('Start-Process -FilePath ([Console]::In.ReadToEnd())', url)
}

module.exports = { available, protect, unprotect, openSetupPage }
