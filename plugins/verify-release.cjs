#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

function inventory(root, relative = '') {
  const result = {}
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const name = relative ? `${relative}/${entry.name}` : entry.name
    const file = path.join(root, name)
    const stat = fs.lstatSync(file)
    if (stat.isSymbolicLink()) throw new Error(`Unexpected symlink: ${name}`)
    if (stat.isDirectory()) Object.assign(result, inventory(root, name))
    else if (stat.isFile()) {
      const data = fs.readFileSync(file)
      result[name] = {
        sha256: crypto.createHash('sha256').update(data).digest('hex'),
        bytes: data.length,
        executable: Boolean(stat.mode & 0o100),
      }
    } else throw new Error(`Unexpected file type: ${name}`)
  }
  return result
}

try {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'release-2.18.7.json'), 'utf8'))
  if (manifest.schemaVersion !== 1 || manifest.packagePath !== 'vibbit' || manifest.version !== '2.18.7') {
    throw new Error('Unexpected release manifest')
  }
  const actual = inventory(path.join(__dirname, 'vibbit'))
  const names = Object.keys(manifest.files).sort()
  if (JSON.stringify(Object.keys(actual).sort()) !== JSON.stringify(names)) {
    throw new Error('Package inventory differs from the published release')
  }
  for (const name of names) {
    const expected = manifest.files[name]
    const file = actual[name]
    if (file.sha256 !== expected.sha256 || file.bytes !== expected.bytes) {
      throw new Error(`File differs from the published release: ${name}`)
    }
    if (process.platform !== 'win32' && file.executable !== expected.executable) {
      throw new Error(`Executable mode differs from the published release: ${name}`)
    }
  }
  console.log(`Verified ${names.length} files against the Vibbit ${manifest.version} release manifest.`)
  console.log(manifest.releaseUrl)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
