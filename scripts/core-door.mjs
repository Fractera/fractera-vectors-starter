// The core's door from this element's commands (node step 563-4): the core's address on the machine's loopback and the node key.
// The address comes from the node (NODE_DOMAIN_FILE → logs/runtime.json, host and port), never remembered; the key is SETTINGS_SECRET of
// this element and is sent as the header X-Node-Key, never printed. The same rule as scripts/ask-core.mjs.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

export const env = (() => {
  const values = {}
  try {
    for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) values[m[1]] = m[2].trim()
    }
  } catch { /* no .env.local: the environment alone */ }
  return { ...values, ...process.env }
})()

export function coreUrl() {
  const domainFile = env.NODE_DOMAIN_FILE?.trim()
  if (domainFile) {
    try {
      const rt = JSON.parse(readFileSync(join(dirname(dirname(domainFile)), 'logs', 'runtime.json'), 'utf8'))
      if (Number.isInteger(rt.port)) return `http://${typeof rt.hostname === 'string' && rt.hostname ? rt.hostname : 'localhost'}:${rt.port}`
    } catch { /* the node did not say its port */ }
  }
  const a = env.ARCHITECT_URL?.trim()
  return a && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(a) ? a.replace(/\/+$/, '') : null
}

/** GET a core door with the node key → { status, body } (body is the parsed JSON, or null). */
export async function coreGet(path) {
  const core = coreUrl()
  const key = env.SETTINGS_SECRET?.trim()
  if (!core) return { status: 0, body: null, error: 'the address of the core is unknown here (NODE_DOMAIN_FILE → logs/runtime.json)' }
  if (!key) return { status: 0, body: null, error: 'no node key here (SETTINGS_SECRET in .env.local)' }
  try {
    const r = await fetch(`${core}${path}`, { headers: { 'X-Node-Key': key }, signal: AbortSignal.timeout(15000) })
    return { status: r.status, body: await r.json().catch(() => null) }
  } catch (e) {
    return { status: 0, body: null, error: `the core did not answer: ${e instanceof Error ? e.message : e}` }
  }
}
