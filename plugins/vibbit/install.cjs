#!/usr/bin/env node
'use strict'
const launcher = require('./launcher/vibbit.cjs')
const backend = require('./install-hosts.cjs')
const main = argv => launcher.main(argv, { root: __dirname, defaultUpdateChannel: 'pinned' })
if (require.main === module) main(process.argv.slice(2)).then(code => { process.exitCode = code }, error => { console.error(`安装未完成：${error.message}`); process.exitCode = 1 })
module.exports = { main, options: backend.options, refresh: backend.refresh }
