// npm run pass -- <main|design|texts> "<the request>" — move the build work of this element to another pass (node step 590-5).
//
// The owner of the node, 2026-10-23: «работа с дизайном, и работа с текстами не должна происходить одновременно с Обще стадией
// разработки … Если есть задача переработать тексты значит это отдельное окно где в контекст приходит только задача по обновлению
// текстов»; 2026-10-25: «Да, командой агента (Рекомендую)». A pass is a session of its own: the node starts it with the request and a
// fresh context, its heavy skills turned on and the others off (.claude/modes/build.md, «Passes»).
// Before you run it: write current-step.md — the new session reads it first, nothing else of this conversation reaches it.
// The command wakes this element through the core's door with the word of the pass — while this session lives the core keeps that pass
// waiting — and then reports done with close: this session ends, and a few seconds later the node starts the waiting pass with the
// request. The session knows its own pass from FRACTERA_PASS (the node sets it); the same pass is refused — do the work here.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { coreUrl, env, ROOT } from './core-door.mjs'

const WORDS = { main: 'Build process:', design: 'Build process, design:', texts: 'Build process, texts:' }
const [pass, ...rest] = process.argv.slice(2)
const request = rest.join(' ').trim()
const fail = (why) => { console.log(`===PASS_FAILED=== ${why}`); process.exit(1) }

if (!WORDS[pass]) { console.log('usage: npm run pass -- <main|design|texts> "<the request>"'); process.exit(2) }
if (process.env.FRACTERA_PASS === pass) { console.log(`===PASS_SAME=== this session already runs the ${pass} pass — do the work here`); process.exit(0) }

let id = null
try { id = JSON.parse(readFileSync(join(ROOT, 'OWN-SERVICE-PROPS', 'OWN-SERVICE-PROPS.json'), 'utf8')).id } catch { /* no passport */ }
if (!id) fail('this element has no id (OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json → id)')
const core = coreUrl()
const key = env.SETTINGS_SECRET?.trim()
if (!core) fail('the address of the core is unknown here (NODE_DOMAIN_FILE → logs/runtime.json)')
if (!key) fail('no node key here (SETTINGS_SECRET in .env.local)')

async function post(door, body) {
  try {
    const r = await fetch(`${core}${door}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Node-Key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })
    return { status: r.status, body: await r.json().catch(() => ({})) }
  } catch (e) {
    return { status: 0, body: { reason: `the core did not answer: ${e instanceof Error ? e.message : e}` } }
  }
}

const text = request ? `${WORDS[pass]} ${request}` : WORDS[pass]
const woke = await post('/api/agents/wake', { service: id, text, reason: 'element-pass' })
if (woke.status !== 200 || !woke.body?.ok) fail(`the core refused the pass (${woke.status}): ${woke.body?.reason ?? JSON.stringify(woke.body)}`)
if (woke.body.pending) {
  console.log(`===PASS_ASKED=== no session of ${id} was running: the node asked the person in Telegram to start the ${pass} pass`)
  process.exit(0)
}
if (!woke.body.queued) {
  // No session of another pass was running (the command ran outside a node session): the pass session has started already.
  console.log(`===PASS_STARTED=== the ${pass} pass of ${id} has started with the request`)
  process.exit(0)
}
const done = await post('/api/agents/done', { service: id, close: true })
if (done.status !== 200 || !done.body?.ok) fail(`the pass waits, but this session did not close (${done.status}): ${done.body?.reason ?? ''} — close the terminal by hand`)
console.log(`===PASS_QUEUED=== the ${pass} pass of ${id} starts when this session closes (in a few seconds)`)
