#!/usr/bin/env node
'use strict'
require('./install.cjs').main(['--host', 'codex', ...process.argv.slice(2)]).then(
  code => { process.exitCode = code },
  error => { console.error(`安装未完成：${error.message}`); process.exitCode = 1 },
)
