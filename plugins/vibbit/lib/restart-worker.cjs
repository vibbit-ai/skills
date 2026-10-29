#!/usr/bin/env node
'use strict'

const { readJson, writeJson } = require('./common.cjs')
const { restartApp } = require('./restart.cjs')

async function main() {
  const request = readJson(process.argv[2])
  const results = []
  // All install work is finished before this detached worker starts. It can
  // reopen the calling app even if its graceful quit terminates the installer.
  for (const host of request.hosts) {
    try { results.push(await restartApp(host, request.allowRestart === true)) }
    catch { results.push({ host, state: 'pending', reason: 'normal_app_restart_failed' }) }
    writeJson(request.resultPath, { done: false, results })
  }
  writeJson(request.resultPath, { done: true, results })
}
main().catch(() => { process.exitCode = 1 })
