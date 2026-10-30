// NEED A CAPABILITY THIS NODE MAY NOT HAVE YET (node step 589-2).
//   npm run need -- "<what you need, in English, one sentence>" [--use "<what you will do with it>"]
//   npm run need -- status
//
// The owner of the node, 2026-10-24: «Получив на уровне узла такой запрос сразу определяешь … есть у него это или нет. Если нет то
// сообщить элементу который запросил … мы приступаем к её разработке по факту готовности можно будет реализовать вашу задачу».
// The core records the need (its door POST /api/node/needs, the node key, no model) and wakes its main agent — the same way as
// `npm run ask-core`. The main agent finds who does it by the A2A cards; nobody does — it asks the architect to build it. The answer
// comes into your input as «Answer from the core to «<need>»: …» — continue your work with it, do not guess meanwhile.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, env, coreUrl, coreGet } from './core-door.mjs'

const fail = (msg) => { console.log(`===NEED_FAIL=== ${msg}`); process.exit(1) }
const args = process.argv.slice(2)
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] ?? '' : null }
let id = null
try { id = JSON.parse(readFileSync(join(ROOT, 'OWN-SERVICE-PROPS', 'OWN-SERVICE-PROPS.json'), 'utf8')).id } catch { /* no passport */ }
if (!id) fail('this element has no id (OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json → id)')

if (args[0] === 'status') {
  const r = await coreGet(`/api/node/needs?from=${encodeURIComponent(id)}`)
  if (!r.body?.ok) fail(r.error ?? `the core answered ${r.status}`)
  const list = r.body.needs ?? []
  console.log(list.length ? list.map((n) => `${n.id} · ${n.stage}${n.owner ? ` · ${n.owner}` : ''}${n.skill ? ` · ${n.skill}` : ''} · «${n.need}»`).join('\n') : 'no needs of this element')
  process.exit(0)
}

const use = flag('--use')
const need = args.filter((a, i) => a !== '--use' && args[i - 1] !== '--use').join(' ').replace(/\s+/g, ' ').trim()
if (need.length < 8) fail('need -- "<what you need, in English, one sentence>" [--use "<what you will do with it>"]')
const core = coreUrl()
const key = env.SETTINGS_SECRET?.trim()
if (!core) fail('the address of the core is unknown here (NODE_DOMAIN_FILE → logs/runtime.json)')
if (!key) fail('no node key here (SETTINGS_SECRET in .env.local)')

try {
  const r = await fetch(`${core}/api/node/needs`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-node-key': key },
    body: JSON.stringify({ from: id, need, use: use ?? '' }), signal: AbortSignal.timeout(15000),
  })
  const b = await r.json().catch(() => ({}))
  if (!b.ok) fail(`the core answered ${r.status}: ${b.error ?? 'no reason'}`)
  const n = b.need
  // The process word opens the request (552-4): finding or building a capability is building work of the node.
  const text = `Build process: Element ${id} needs a capability: «${need}»${use ? ` (what for: «${use}»)` : ''} — need ${n.id}. Find who does it, or ask the architect to build it (npm run needs -- show ${n.id}).`
  const w = await fetch(`${core}/api/agents/wake`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-node-key': key },
    body: JSON.stringify({ service: 'build', from: id, about: need.slice(0, 300), reason: 'element-need', text }), signal: AbortSignal.timeout(30000),
  })
  const wb = await w.json().catch(() => ({}))
  const how = !wb.ok ? `recorded, but the main agent did not wake (${wb.reason ?? w.status}) — the architect sees it with npm run needs` : wb.pending ? 'the person is asked in Telegram to turn the main agent on' : wb.already ? 'pasted into the main agent\'s live session' : 'the main agent woke'
  console.log(`===NEED_OK=== ${n.id} · ${how}`)
  console.log('The answer comes into your input as «Answer from the core to «…»: …». Meanwhile go on with what you can do without it.')
} catch (e) {
  fail(e instanceof Error ? e.message : String(e))
}
