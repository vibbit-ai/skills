'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { spawnSync } = require('node:child_process')

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'))
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
  const temp = `${file}.${process.pid}.tmp`
  fs.writeFileSync(temp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 })
  fs.renameSync(temp, file)
}
function files(root, prefix = '') {
  return fs.readdirSync(path.join(root, prefix), { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(prefix, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`发行包不能包含符号链接：${relative}`)
    if (entry.isDirectory()) return files(root, relative)
    if (!entry.isFile()) throw new Error(`不支持的文件：${relative}`)
    return [relative]
  }).sort()
}
function inventory(root) {
  return Object.fromEntries(files(root).map(name => [name, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex')]))
}
function run(file, args, options = {}) {
  const result = spawnSync(file, args, { encoding: 'utf8', shell: false, timeout: 60000, maxBuffer: 8 * 1024 * 1024, windowsHide: true, ...options })
  if (result.error || result.status !== 0) {
    // CLI output can contain account data. Keep errors bounded to command/status.
    const error = new Error(`${path.basename(file)} ${args.slice(0, 3).join(' ')} 未完成（${result.error?.code || result.status || result.signal}）`)
    error.code = result.error?.code || 'CLI_FAILED'
    throw error
  }
  return result.stdout.trim()
}
function findObject(value, predicate) {
  if (!value || typeof value !== 'object') return null
  if (predicate(value)) return value
  for (const child of Object.values(value)) {
    const found = findObject(child, predicate)
    if (found) return found
  }
  return null
}
function stableCopy(root, store, version) {
  const source = inventory(root)
  const digest = crypto.createHash('sha256').update(JSON.stringify(source)).digest('hex')
  const destination = path.join(store, 'packages', version, digest.slice(0, 20))
  if (fs.existsSync(destination)) {
    if (JSON.stringify(inventory(destination)) !== JSON.stringify(source)) throw new Error('持久安装来源已被修改，请保留现场检查')
    return destination
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 })
  const temp = fs.mkdtempSync(path.join(path.dirname(destination), '.staging-'))
  try {
    fs.cpSync(root, temp, { recursive: true, errorOnExist: true, force: false })
    if (JSON.stringify(inventory(temp)) !== JSON.stringify(source)) throw new Error('持久安装来源复制校验失败')
    fs.renameSync(temp, destination)
  } finally { if (fs.existsSync(temp)) fs.rmSync(temp, { recursive: true, force: true }) }
  return destination
}
module.exports = { readJson, writeJson, files, inventory, run, findObject, stableCopy }
