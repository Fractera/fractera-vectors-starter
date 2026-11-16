// YOUR PERSON'S BROWSER FROM TELEGRAM (core step 767). A wish inside your field: do it in the browser yourself (the Claude extension),
// then bring the tab before their eyes — only macOS can, so the core does it for every element, with no model:
//   npm run browser -- focus <https://… or a host>                     the tab with that address comes onto their screen
//   npm run browser -- open <https://…> [--profile <Chrome profile name>]  open a page before their eyes
// You get «found / opened» or the reason — never their other tabs. A wish OUTSIDE your field is not yours: `npm run tell-core` with
// their words, nothing else; the core's main agent decides who does it. The browser of the computer is the architect's: an element on
// its own person's subscription, or a node of several owners, is refused.
// 🔒 The core is reached on loopback, its port asked from the node (NODE_DOMAIN_FILE → logs/runtime.json), with the node key — as ask-core.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const fail = (msg) => { console.error(`===BROWSER_FAILED=== ${msg}`); process.exit(1) }

function envFile() {
  const out = {}
  try {
    for (const line of readFileSync(join(root, '.env.local'), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) out[m[1]] = m[2].trim()
    }
  } catch { /* no file — the process environment only */ }
  return out
}
const env = { ...envFile(), ...process.env }

function ownId() {
  try {
    const id = JSON.parse(readFileSync(join(root, 'OWN-SERVICE-PROPS', 'OWN-SERVICE-PROPS.json'), 'utf8')).id
    if (typeof id === 'string' && id) return id
  } catch { /* no passport */ }
  return env.ITEM_ID?.trim() || null
}

function coreUrl() {
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

const args = process.argv.slice(2)
const flag = (name) => { const i = args.indexOf(name); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v ?? null }
const id = ownId()
const core = coreUrl()
const key = env.SETTINGS_SECRET?.trim()
if (!id) fail('this element has no id (OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json → id)')
if (!core || !key) fail('the core is unknown here (NODE_DOMAIN_FILE → logs/runtime.json, SETTINGS_SECRET in .env.local)')

let body
if (args[0] === 'focus' && args[1]) body = { from: id, focus: args[1] }
else if (args[0] === 'open' && args[1]) { const profile = flag('--profile'); body = { from: id, open: args[1], ...(profile ? { profile } : {}) } }
else fail('npm run browser -- focus <https://… or a host> | open <https://…> [--profile <Chrome profile name>]')

const WHY = {
  'not-found': 'no open tab has that address — nothing was opened; open it: npm run browser -- open <https://…>',
  'own-subscription': 'this element runs on its own person\'s subscription: the browser of this computer is the architect\'s',
  'app-factory': 'this node holds projects of several owners: the browser of this computer is the architect\'s — pass the wish by npm run tell-core',
  'not-mac': 'the computer of the node is not a Mac: the browser from Telegram is built for macOS so far',
  'automation-pending': 'macOS is asking on the screen whether the node may control Google Chrome — your person presses OK once (npm run ask-person with that hint), then again',
  'automation-denied': 'macOS refused the node control of Chrome — your person turns it on in System Settings → Privacy & Security → Automation (npm run ask-person)',
  'not-running': 'Google Chrome is not open on the computer',
}
try {
  const r = await fetch(`${core}/api/node/browser`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-node-key': key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })
  const b = await r.json().catch(() => ({}))
  if (!b.ok) {
    console.log(`===BROWSER_REFUSED=== ${b.reason ?? r.status}${WHY[b.reason] ? ` — ${WHY[b.reason]}` : ''}`)
    process.exitCode = 1
  } else if (body.focus) console.log('===BROWSER_FOCUSED=== the tab is before your person\'s eyes — ask them whether they see it')
  else console.log(`===BROWSER_OPENED=== ${b.host}${b.profile ? ` in the profile «${b.profile}»` : ''}${b.front === 'unconfirmed' ? ' — Chrome took it; ask your person whether they see it' : ' — before their eyes'}`)
} catch (e) {
  fail(`the core did not answer at ${core} — ${e instanceof Error ? e.message : e}`)
}
