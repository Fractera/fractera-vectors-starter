// npm run passport — this element's passport as its own node sees it (OWN-SERVICE-PROPS/README.md).
//   npm run passport            — the whole passport
//   npm run passport -- me      — only who I am: identity, job, addresses, where it runs, this machine, ties, and the block `node`
//   npm run passport -- project — only the block `node`: the core, the main agent, how many elements, how to find one (fixed size)
// The short modes exist because the whole answer is long (routes, descriptions): an agent cutting it with head missed the
// node's elements and went around the passport to the core's files (live run 2026-10-06).
// Asks the running element's door on this machine with the node key from .env.local, so the answer carries the node-only parts:
// `self` (port, local address, folder) and `project` (domain, core, every element of the node, how to cooperate — i2i).
// The key never leaves this machine and is never printed.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const env = Object.fromEntries(
  readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
)
const port = env.PORT
if (!port) {
  console.error('PASSPORT_FAILED: no PORT in .env.local — the element is not installed on this node')
  process.exit(1)
}
try {
  const r = await fetch(`http://localhost:${port}/api/own-service-props`, { headers: { 'X-Node-Key': env.SETTINGS_SECRET ?? '' } })
  if (!r.ok) throw new Error(`the door answered ${r.status}`)
  const p = await r.json()
  const mode = process.argv[2]
  // 548 (owner 2026-10-19): with whom this element works, by which protocol and API — read from its card, printed first.
  const cardFile = join(process.cwd(), 'OWN-SERVICE-PROPS', 'A2A-CARD.json')
  const card = existsSync(cardFile) ? JSON.parse(readFileSync(cardFile, 'utf8')) : null
  const ext = (card?.capabilities?.extensions ?? []).find((e) => /\/a2a\/ext\/node\//.test(e?.uri ?? ''))?.params ?? {}
  const via = (v) => !v ? 'no API recorded'
    : v.kind === 'mcp' ? `MCP ${v.tool} at ${v.base}${v.path ?? ''}, key ${v.key}${v.also ? `; also ${v.also}` : ''}`
    : v.kind === 'a2a-skill' ? `A2A code skill ${v.skill}`
    : `${v.method ?? ''} ${v.path} at ${v.base}, key ${v.key}${v.also ? `; also ${v.also}` : ''}`
  const links = (ext.consumes ?? []).map((c) => `${c.from} — ${c.protocol ?? 'protocol not recorded'} — ${via(c.via)} — ${c.why}`)
  // 548-9 (owner 2026-10-19: the element first understands «какие у него есть способы взаимодействия с внешним миром»): the
  // protocols this element may use, from its type and passport flags; the details — the skill of each protocol (CLAUDE.md, «Protocols»).
  // The door does not always carry the passport flags — then they are read from the passport file itself.
  const own = (() => { try { return JSON.parse(readFileSync(join(process.cwd(), 'OWN-SERVICE-PROPS', 'OWN-SERVICE-PROPS.json'), 'utf8')) } catch { return {} } })()
  const native = (p.elementType ?? own.elementType) === 'native'
  const m = p.messengers ?? own.messengers ?? {}
  const protocols = [
    m.h2a !== false && 'H2A — your person and you (Telegram, this terminal)',
    'i2i — the elements of this node and the core: an API agreed once, then no model',
    !native && m.a2a && 'a2a — jobs for agents of other nodes through Lagrix (working process)',
    !native && 'f2f — whole elements from other Fractera projects through Lagrix: npm run f2f -- find <words>',
    !native && m.h2h && 'H2H — people through their agents',
  ].filter(Boolean)
  const lang = env.NEXT_PUBLIC_LANG || 'en'
  // 548-14 (owner 2026-10-20: the cost of an agent must not grow with the node): where this element lives, in a block of fixed
  // size — never the list of elements. Measured: the list was ~230 bytes per element (1000 elements → ~250 KB on every wake).
  // A neighbour is found by need: npm run a2a -- find <English words> (at most five).
  const core = p.project?.core
  const node = {
    domain: p.project?.domain, core,
    mainAgent: `the core's main agent routes a need to an element and creates new elements — its terminal ${core}/${lang}/architect/build/terminal`,
    elements: (p.project?.elements ?? []).length,
    find: 'npm run a2a -- find <plain English words of the job> — who in the node does it, at most five; npm run a2a -- card <address> — one of them in full',
    cooperation: p.project?.cooperation,
  }
  const out = mode === 'me'
    ? {
        links, protocols, elementType: p.elementType ?? own.elementType, messengers: m,
        // 548-6 (repeat QA, 2026-10-20): the role in the node and the languages come with the first answer. Measured: without them
        // the agent spent three model requests looking for its default language and learned its role only from `project`.
        role: (p.project?.elements ?? []).find((e) => e.id === p.id)?.role || null,
        languages: { default: env.NEXT_PUBLIC_DEFAULT_LOCALE?.trim().toLowerCase() || 'en', supported: (env.NEXT_PUBLIC_SUPPORTED_LANGUAGES || 'en').split(',').map((l) => l.trim()).filter(Boolean) },
        id: p.id, name: p.name, shortDescription: p.shortDescription, accepts: p.accepts, returns: p.returns, designSkill: p.designSkill, isFracteraArchitecture: p.isFracteraArchitecture, framework: p.framework, skills: p.skills, tools: p.tools,
        visibility: p.visibility,
        addresses: { ...p.addresses, routes: `${p.addresses?.routes?.length ?? 0} public pages — npm run passport for the list` },
        host: p.host, machine: p.machine, version: p.version, commit: { hash: p.commit?.hash, count: p.commit?.count },
        github: p.github, calls: p.calls, calledBy: p.calledBy,
        // Node step 552-6 (owner 2026-10-20: «remember about saving info to own service props»): the element's Telegram bots — h2a, h2h,
        // orders, work — handle and name only, written by the core when the architect connects one; no token ever.
        telegramBots: own.telegramBots ?? {},
        node,
      }
    : mode === 'project'
      ? node
      : p
  console.log(JSON.stringify(out, null, 2))
} catch (e) {
  console.error(`PASSPORT_FAILED: ${e.message} — is the element running? (npm run passport asks http://localhost:${port})`)
  process.exit(1)
}
