// npm run a2a -- <command> — this element's agent talks to its neighbours through the official A2A SDK client (step 418-2).
// The SDK builds and reads every message (A2A v1.0.0), so the agent never hand-writes JSON-RPC or curl. The node key and the
// port come from .env.local; the key is sent as a header and never printed. Body text travels as UTF-8 by itself.
//
//   find <words…>                         who in the node can do it (the core's A2A registry), best first
//   card <address>                        a neighbour's card: what it does, its skills
//   send <address> "<text>"               a task for the neighbour's agent (it answers later — use status)
//        [--skill <id> --input '<json>']  …or call a code skill of the neighbour (answers at once)
//        [--context <id>] [--title "<topic>"] [--task <taskId>]   continue a conversation / a task
//   status <address> <taskId>             where a task you sent stands, and its answer
//   cancel <address> <taskId>             cancel a task you sent
//   reply <taskId> "<text>" [--failed] [--data '<json>']   answer a task that was pasted into YOUR terminal
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { Message, Task, SendMessageRequest, GetTaskRequest, CancelTaskRequest } from '@a2a-js/sdk'
import { ClientFactory, ClientFactoryOptions, DefaultAgentCardResolver, JsonRpcTransportFactory } from '@a2a-js/sdk/client'
import { blockedReason, checkOutboundData, loadPolicy, logGuard } from '../lib/a2a/guard.mjs'

const env = Object.fromEntries(
  readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
)
const KEY = env.SETTINGS_SECRET ?? ''
const fail = (why) => { console.error(`A2A_FAILED: ${why}`); process.exit(1) }
if (!KEY) fail('no SETTINGS_SECRET in .env.local — the element is not installed on this node')

function coreUrl() {
  try {
    const rt = JSON.parse(readFileSync(join(dirname(dirname(env.NODE_DOMAIN_FILE)), 'logs', 'runtime.json'), 'utf8'))
    return `http://${rt.hostname || 'localhost'}:${rt.port}`
  } catch { return null }
}

/** Who is calling: the element's address; a never-renamed element has no address file — its address is its passport id. */
function ownAddress() {
  try { return JSON.parse(readFileSync(join(env.SERVICE_DATA_DIR, 'address.json'), 'utf8')).address } catch { /* not renamed */ }
  for (const p of [join('OWN-SERVICE-PROPS', 'OWN-SERVICE-PROPS.json'), 'OWN-SERVICE-PROPS.json']) {
    try { const id = JSON.parse(readFileSync(join(process.cwd(), p), 'utf8')).id; if (id) return id } catch { /* next layout */ }
  }
  return null
}

async function registry(query) {
  const core = coreUrl()
  if (!core) fail('the node core is not known (NODE_DOMAIN_FILE)')
  const r = await fetch(`${core}/api/node/a2a?${query}`, { headers: { 'X-Node-Key': KEY } })
  return r.json()
}

/** A neighbour's base URL on this machine, from the core's registry. */
async function urlOf(address) {
  const b = await registry(`address=${encodeURIComponent(address)}`)
  if (!b.ok || !b.entry?.url) fail(`«${address}» is not in the node's A2A registry (no card yet, or no such element)`)
  return b.entry.url
}

async function clientFor(address) {
  const headers = { 'X-Node-Key': KEY }
  const factory = new ClientFactory(ClientFactoryOptions.createFrom(ClientFactoryOptions.default, {
    cardResolver: new DefaultAgentCardResolver({ fetchImpl: (url, init = {}) => fetch(url, { ...init, headers: { ...(init.headers ?? {}), ...headers } }) }),
    transports: [new JsonRpcTransportFactory()],
  }))
  return factory.createFromUrl(await urlOf(address))
}

const opts = { serviceParameters: { 'X-Node-Key': KEY } }
const flag = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined }
const has = (name) => process.argv.includes(`--${name}`)
// Positionals: every argument that is neither a flag nor the value right after a flag that takes one.
const VALUE_FLAGS = new Set(['--skill', '--input', '--context', '--title', '--task', '--data'])
const args = process.argv.slice(2)
const [cmd, ...rest] = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.has(args[i - 1]))
const show = (x) => console.log(JSON.stringify(x, null, 2))
/** One sentence of a neighbour's description — never cut mid-word. */
const firstSentence = (t, n = 200) => {
  const s = String(t ?? '').replace(/\s+/g, ' ').trim()
  const cut = s.match(/^.{20,}?[.!?](?=\s|$)/)?.[0] ?? s
  return cut.length > n ? `${cut.slice(0, Math.max(cut.lastIndexOf(' ', n - 1), 40))}…` : cut
}

/** A task in words: state, the neighbour's sentence, its data. */
function summary(task) {
  const t = Task.toJSON(task)
  const texts = [t.status?.message, ...(t.artifacts ?? [])].flatMap((m) => m?.parts ?? []).map((p) => p.text).filter(Boolean)
  const data = (t.artifacts ?? []).flatMap((a) => a.parts ?? []).map((p) => p.data).filter((d) => d !== undefined)
  return { taskId: t.id, contextId: t.contextId, state: t.status?.state, text: texts.join('\n'), data: data.length ? data : undefined }
}

try {
  if (cmd === 'find') {
    const words = rest.join(' ').trim()
    if (!words) fail('find <words> — what you need, in plain words')
    // 548-14 (owner 2026-10-20: the cost of an agent must not grow with the node): at most five candidates, one sentence each;
    // the full card of the one you pick — npm run a2a -- card <address>.
    const b = await registry(`q=${encodeURIComponent(words)}&limit=5`)
    const entries = (b.entries ?? []).slice(0, 5)
    // role — what the node made the element for (the core's main agent gives it); description and skills — what its card says is
    // built today. A just-born element still carries the template's card, so its role is the only word about its job (548-14:
    // measured live, the role was not printed and a neighbour made for slugs was read as «no slug skill»).
    if (entries.length) show(entries.map((e) => ({ address: e.address, role: e.role || undefined, description: firstSentence(e.description), skills: e.skills?.map((s) => s.id), state: e.state })))
    else console.log(/[a-z]/i.test(words)
      ? `Nobody in this node does «${words}» — go on with the order «Before you build a new capability» (`.claude/modes/build.md`, «Steps», 1b).`
      : `Nothing found for «${words}»: the node's registry is written in English — search again with English words.`)
  } else if (cmd === 'card') {
    if (!rest[0]) fail('card <address>')
    const client = await clientFor(rest[0])
    const card = await client.getAgentCard()
    show({ name: card.name, description: card.description, skills: card.skills?.map((s) => ({ id: s.id, description: s.description, examples: s.examples })) })
  } else if (cmd === 'send') {
    const [address, text] = rest
    if (!address || !text) fail('send <address> "<text for the person and the neighbour>"')
    const parts = [{ text, mediaType: 'text/plain' }]
    if (flag('skill')) parts.push({ data: { skill: flag('skill'), input: flag('input') ? JSON.parse(flag('input')) : {} } })
    const message = {
      messageId: randomUUID(), role: 'ROLE_USER', contextId: flag('context') ?? randomUUID(), parts,
      metadata: { from: ownAddress() ?? 'unknown', ...(flag('title') ? { title: flag('title') } : {}) },
      ...(flag('task') ? { taskId: flag('task') } : {}),
    }
    // Outbound guard (step 419-2): checked before any network call — a denied message never leaves this machine.
    const checked = checkOutboundData(parts, loadPolicy(process.cwd()))
    if (checked.rules.length) logGuard(env.SERVICE_DATA_DIR, { channel: 'send', verdict: checked.verdict, rules: checked.rules, to: address })
    if (checked.verdict === 'deny') fail(blockedReason(checked.rules))
    message.parts = checked.data
    const client = await clientFor(address)
    const result = await client.sendMessage(SendMessageRequest.fromJSON({ message, configuration: { returnImmediately: true } }), opts)
    show(result && 'status' in result ? summary(result) : Message.toJSON(result))
  } else if (cmd === 'status' || cmd === 'cancel') {
    const [address, id] = rest
    if (!address || !id) fail(`${cmd} <address> <taskId>`)
    const client = await clientFor(address)
    const task = cmd === 'status'
      ? await client.getTask(GetTaskRequest.fromJSON({ id }), opts)
      : await client.cancelTask(CancelTaskRequest.fromJSON({ id }), opts)
    show(summary(task))
  } else if (cmd === 'reply') {
    const [id, text] = rest
    if (!id || !text) fail('reply <taskId> "<answer in plain words>"')
    const body = { text, ...(flag('data') ? { data: JSON.parse(flag('data')) } : {}), ...(has('failed') ? { failed: true } : {}) }
    const r = await fetch(`http://127.0.0.1:${env.PORT}/api/a2a/tasks/${encodeURIComponent(id)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Node-Key': KEY }, body: JSON.stringify(body),
    })
    const out = await r.json().catch(() => ({}))
    if (!r.ok) fail(out.reason ?? `the answer door said ${r.status}: ${out.error ?? ''}`)
    show(out)
  } else {
    fail('commands: find · card · send · status · cancel · reply  (see the top of scripts/a2a.mjs)')
  }
} catch (e) {
  fail(String(e?.message ?? e))
}
