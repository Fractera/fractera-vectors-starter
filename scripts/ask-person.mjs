// THE PERSON'S HANDS (core step 761-16d). A step only your person may do — a password, a sign-in, a code, a /start, an irreversible click:
//   npm run ask-person -- "<what to do, in the person's language>" [--href </ru/…|https://…>] [--why "<why only they>"] [--hint "<what may pop up and what to press>"]
//   npm run ask-person -- list        your open requests
//   npm run ask-person -- drop <id>   take your request back
//   npm run ask-person -- done <id>   your person answered «Готово · <id>» in Telegram (it came to you as their message): close it
//   [--copy "<a command they paste>"]  the window and the Telegram message show it apart, with a copy button (core 761-16b, 764-a)
//   [--secret <NAME> --where <https://…>]  a key of your own account: a masked field in the window, the core writes it into your key file
//                                          and restarts you; you get «saved, ends …a1b2», never the value (core step 768)
// The core shows it as an orange window at the bottom of every page of the node's panel, naming this element, until the person
// presses «Готово»; that press wakes YOU with `⟦node · person-done · <this element> · HH:MM⟧`: check the result yourself, then go on.
// The owner, 2026-11-16: «уведомление на экране которое невозможно пропустить … и подтвердить о его завершении»; «лучше показывать
// снизу»; «все элементы … получают обновления связанные с работой новых подсказок». Never a line in the chat instead.
// 🔒 The core is reached on loopback, its port asked from the node (NODE_DOMAIN_FILE → logs/runtime.json), with the node key — as ask-core.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = process.cwd()
const fail = (msg) => { console.error(`===ASK_PERSON_FAILED=== ${msg}`); process.exit(1) }

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
if (args[0] === 'list') body = { from: id, list: true }
else if (args[0] === 'drop') body = { from: id, drop: args[1] ?? '' }
else if (args[0] === 'done') body = { from: id, done: (/([a-f0-9]{8})\b/.exec(args.slice(1).join(' '))?.[1]) ?? '' }
else {
  const href = flag('--href'); const why = flag('--why'); const hint = flag('--hint'); const copy = flag('--copy')
  // core step 768: a key of your own account — the person types it in the window's masked field; it goes straight into your key file
  const secretName = flag('--secret'); const where = flag('--where')
  const text = args.join(' ').replace(/\s+/g, ' ').trim()
  if (!text) fail('ask-person -- "<what to do, in the person\'s language>" [--href …] [--why …] [--hint …]')
  body = { from: id, text, href, why, hint, copy, ...(secretName ? { secret: { name: secretName, ...(where ? { where } : {}) } } : {}) }
}
try {
  const r = await fetch(`${core}/api/node/person-asks`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-node-key': key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })
  const b = await r.json().catch(() => ({}))
  if (!b.ok) fail(`the core answered ${r.status}: ${b.reason ?? 'no reason'}`)
  if (body.list) console.log(b.asks?.length ? b.asks.map((a) => `${a.id} · ${String(a.at).slice(11, 16)} UTC · ${a.text}`).join('\n') : 'no open requests')
  else if (body.drop !== undefined) console.log(`===ASK_DROPPED=== ${body.drop}`)
  else if (body.done !== undefined) console.log(b.done ? `===ASK_DONE=== ${body.done} — closed; check the result yourself, then go on` : `===ASK_ALREADY=== ${body.done} was closed in the panel already — tell your person it was done`)
  else if (body.secret) console.log(`===ASK_PUT=== ${b.id} — a window with a masked field for ${body.secret.name}, naming this element; the person's «Сохранить» writes it into your key file, restarts you and wakes you (person-done) — you never see the value.${b.telegram ? ' Telegram got a note that it is typed only in the window.' : ''} Say one line to your person that the window waits for them.`)
  else console.log(`===ASK_PUT=== ${b.id} — an orange window at the bottom of every panel page, naming this element, until «Готово»; the press wakes you (person-done).${b.telegram ? ` Also sent to Telegram: their reply «Готово · ${b.id}» comes to you as a message — then npm run ask-person -- done ${b.id}.` : ''} Say one line to your person that the window waits for them.`)
} catch (e) {
  fail(`the core did not answer at ${core} — ${e instanceof Error ? e.message : e}`)
}
