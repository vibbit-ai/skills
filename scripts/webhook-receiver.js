#!/usr/bin/env node
'use strict'

const http = require('node:http')
const fs = require('node:fs/promises')
const path = require('node:path')
const { verifyWebhook } = require('./lib/webhook')
const { resolveAccount, resolveCredential } = require('./lib/auth-store')

async function startReceiver({ key, directory, port = 8787, now = Date.now }) {
  if (!key || !path.isAbsolute(directory) || !Number.isSafeInteger(port) || port < 0 || port > 65535) throw new Error('Use a credential, an absolute private receipt directory and a valid port')
  await fs.mkdir(directory, { recursive: true, mode: 0o700 })
  const info = await fs.lstat(directory)
  if (!info.isDirectory() || info.isSymbolicLink() || (process.platform !== 'win32' && (info.uid !== process.getuid() || (info.mode & 0o077)))) throw new Error('Webhook receipt directory must be private and owned by the current user')
  const server = http.createServer(async (req, res) => {
    const reply = status => { if (!res.headersSent) res.writeHead(status, { 'Cache-Control': 'no-store' }); res.end() }
    if (req.method !== 'POST' || req.url !== '/webhook') return reply(404)
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return reply(415)
    let raw, body
    try {
      const chunks = []; let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > 8 * 1024 * 1024) { reply(413); req.resume(); return }
        chunks.push(chunk)
      }
      raw = Buffer.concat(chunks)
      body = verifyWebhook(raw, req.headers['x-webhook-signature'], key, { now: now() })
    } catch { return reply(400) }
    const file = path.join(directory, body.payload_sha256 + '.json')
    try {
      // Save receipts, not business actions. A changed result for the same task has a different digest.
      let handle
      try { handle = await fs.open(file, 'wx', 0o600) } catch (error) {
        if (error.code !== 'EEXIST') throw error
        const saved = await fs.readFile(file)
        if (!saved.equals(raw)) throw new Error('Receipt collision')
      }
      if (handle) {
        try { await handle.writeFile(raw); await handle.sync() } catch (error) {
          await handle.close(); handle = undefined; await fs.unlink(file); throw error
        } finally { if (handle) await handle.close() }
      }
      reply(204)
    } catch { reply(503) }
  })
  server.requestTimeout = 30000
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve) })
  return server
}

async function main(argv) {
  if (!argv.length || argv.includes('--help')) return { usage: 'node scripts/webhook-receiver.js --dir ABSOLUTE_PRIVATE_DIRECTORY [--port 8787] [--region cn|global]',
    note: 'Optional loopback receiver. Expose its /webhook route through your own HTTPS proxy or tunnel, then configure the URL on the submitting API Key. Never put that Key in a URL or tool argument.' }
  const flags = {}
  for (let i = 0; i < argv.length; i += 2) {
    if (!['--dir', '--port', '--region'].includes(argv[i]) || !argv[i + 1] || flags[argv[i]]) throw new Error('Use --dir, --port and --region once each')
    flags[argv[i]] = argv[i + 1]
  }
  const credential = await resolveCredential({ account: await resolveAccount({ region: flags['--region'] }) })
  const server = await startReceiver({ key: credential.key, directory: flags['--dir'], port: flags['--port'] === undefined ? 8787 : Number(flags['--port']) })
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { server.close(); server.closeAllConnections() })
  return { listening: true, address: '127.0.0.1', port: server.address().port, route: '/webhook', receipt_directory: flags['--dir'], business_processing: false }
}

if (require.main === module) main(process.argv.slice(2)).then(value => process.stdout.write(JSON.stringify(value) + '\n')).catch(() => { process.stderr.write('Webhook receiver could not start. Check local credentials, port and the private receipt directory.\n'); process.exitCode = 1 })
module.exports = { startReceiver, main }
