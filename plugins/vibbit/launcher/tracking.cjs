'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')

function prepareTarget(source, config, opts, version, common) {
  const store = opts.store || path.join(os.homedir(), '.vibbit-installer')
  fs.mkdirSync(store, { recursive: true, mode: 0o700 })
  const temp = fs.mkdtempSync(path.join(store, '.target-'))
  try {
    const copy = path.join(temp, 'package')
    fs.cpSync(source, copy, { recursive: true })
    const profileEnv = {}
    const keys = config.host === 'codex' ? ['CODEX_HOME'] : config.host === 'claude' ? ['CLAUDE_CONFIG_DIR', 'CLAUDE_CODE_PLUGIN_CACHE_DIR']
      : config.host === 'openclaw' ? ['OPENCLAW_HOME', 'OPENCLAW_STATE_DIR', 'OPENCLAW_CONFIG_PATH'] : []
    for (const key of keys) if (process.env[key]) profileEnv[key] = path.resolve(process.env[key].replace(/^~(?=[/\\]|$)/, os.homedir()))
    const installArgs = [`--${config.host}-cli`, config.cli]
    if (config.host === 'workbuddy') installArgs.push('--workbuddy-config', config.configDir)
    for (const key of ['codex-socket', 'workbuddy-url']) if (opts[key]) installArgs.push(`--${key}`, opts[key])
    const profile = JSON.stringify({ host: config.host, cli: config.cli, configDir: config.configDir, profileEnv })
    const revision = common.readJson(path.join(source, 'update-source.json')).revision
    common.writeJson(path.join(copy, 'update-source.json'), {
      schemaVersion: 1, repository: 'vibbit-ai/skills', version, channel: opts['update-channel'],
      ...(revision ? { revision } : {}),
      host: config.host, profileId: crypto.createHash('sha256').update(profile).digest('hex'),
      store, installArgs, profileEnv,
    })
    // Seed the stable cache through a fresh child directory on every Node version.
    const inventory = JSON.stringify(common.inventory(copy))
    const digest = crypto.createHash('sha256').update(inventory).digest('hex').slice(0, 20)
    const destination = path.join(store, 'packages', version, digest)
    if (fs.existsSync(destination)) {
      if (JSON.stringify(common.inventory(destination)) !== inventory) throw new Error('持久安装来源已被修改，请保留现场检查')
    } else {
      fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 })
      fs.renameSync(copy, destination)
    }
    return destination
  } finally { fs.rmSync(temp, { recursive: true, force: true }) }
}
module.exports = { prepareTarget }
