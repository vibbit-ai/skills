#!/usr/bin/env node
'use strict'
const args = process.argv.slice(2).map(arg => arg === '--config-dir' ? '--workbuddy-config' : arg)
require('./install.cjs').main(['--host', 'workbuddy', ...args]).then(
  code => { process.exitCode = code },
  error => { console.error(`安装未完成：${error.message}`); process.exitCode = 1 },
)
