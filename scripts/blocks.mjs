#!/usr/bin/env node
// npm run blocks — find, see and install the blocks of the node's catalogue (node step 577-4; skill `use-blocks`).
//
//   npm run blocks -- find "<need in words>" [--role opener|body|closer] [--category <section>] [--collection <project>]
//   npm run blocks -- show <block>
//   npm run blocks -- add <block> [--force]
//   npm run blocks -- request "<need in words>" [--page <path>] [--project <id>]
//   npm run blocks -- collection <project>
//   any command: [--registry <url>] — another copy of the Blocks element (a preview) instead of the one the core names
//
// 🔒 THE BLOCKS ELEMENT IS FOUND THROUGH THE CORE, not through an address in .env.local: measured 2026-10-23, none of the 14 elements
// of this node had BLOCKS_REGISTRY_URL, so `npx shadcn add @fractera/<name>` worked nowhere. The core's registry
// (`GET <core>/api/node/a2a?address=blocks`, the node key) names the Blocks element's address on this machine.
// 🔒 `add` installs from the same registry JSON shadcn reads, writes the block's own files, writes a dependency only when it is missing
// (the element's own ui and typography are never overwritten), then registers the block in the three places a page kind lives:
// `lib/content/blocks/registry.tsx` (BLOCK_SET), `lib/content/blocks/types.ts` (Block), `lib/aio/blocks-to-markdown.ts` (machine copy).
// ✗ Measured 2026-10-23: the element graph registered four blocks by hand and forgot the machine copy — its /en/index.md lost every text
// of them. Here the three lines come from the block's card (`props`, `markdown`), so none is forgotten.
// 🔒 An installed block that was changed by hand is never overwritten silently: `components/blocks/.blocks-lock.json` keeps the
// fingerprint of what `add` wrote; a different file stops `add` (request a variant of the block instead, or pass --force).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const ROOT = process.cwd()
const args = process.argv.slice(2)
const cmd = args[0]
const VALUE_FLAGS = new Set(['--role', '--category', '--collection', '--page', '--project', '--registry'])
const positional = args.slice(1).filter((a, i, all) => !a.startsWith('--') && !(i > 0 && VALUE_FLAGS.has(all[i - 1])))
const flag = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const has = (n) => args.includes(`--${n}`)
const die = (msg) => { console.error(`===BLOCKS_FAILED=== ${msg}`); process.exit(1) }
const norm = (s) => String(s).replace(/\r\n/g, '\n')
const sha = (s) => createHash('sha256').update(norm(s)).digest('hex').slice(0, 16)

const env = Object.fromEntries(
  (existsSync(join(ROOT, '.env.local')) ? readFileSync(join(ROOT, '.env.local'), 'utf8') : '')
    .split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
)
const KEY = env.SETTINGS_SECRET ?? ''
if (!KEY) die('no SETTINGS_SECRET in .env.local — run this in the folder of an element installed by the node')

function coreUrl() {
  try {
    const rt = JSON.parse(readFileSync(join(dirname(dirname(env.NODE_DOMAIN_FILE)), 'logs', 'runtime.json'), 'utf8'))
    return `http://${rt.hostname || 'localhost'}:${rt.port}`
  } catch { return null }
}

function ownAddress() {
  try { return JSON.parse(readFileSync(join(env.SERVICE_DATA_DIR, 'address.json'), 'utf8')).address } catch { /* never renamed */ }
  try { return JSON.parse(readFileSync(join(ROOT, 'OWN-SERVICE-PROPS', 'OWN-SERVICE-PROPS.json'), 'utf8')).id } catch { return null }
}

async function nodeEntry(address) {
  const core = coreUrl()
  if (!core) die('the node core is not known (NODE_DOMAIN_FILE in .env.local)')
  const r = await fetch(`${core}/api/node/a2a?address=${encodeURIComponent(address)}`, { headers: { 'X-Node-Key': KEY } }).catch((e) => die(`the core does not answer: ${e.cause?.code ?? e.message}`))
  const b = await r.json().catch(() => ({}))
  return b.ok ? b.entry : null
}

async function blocksUrl() {
  const given = flag('registry') ?? process.env.BLOCKS_REGISTRY_URL
  if (given) return given.replace(/\/+$/, '')
  const e = await nodeEntry('blocks')
  if (!e?.url) die('the node has no Blocks element in its registry (address «blocks»)')
  return e.url.replace(/\/+$/, '')
}

async function getJson(url, withKey = false) {
  const r = await fetch(url, withKey ? { headers: { 'X-Node-Key': KEY } } : undefined).catch((e) => die(`${url} does not answer: ${e.cause?.code ?? e.message}`))
  const b = await r.json().catch(() => ({}))
  if (!r.ok) die(`${r.status} ${b.error ?? ''}: ${b.reason ?? url}`)
  return b
}

/** Git Bash turns «/en» into «C:/Program Files/Git/en» before node sees it (measured 2026-10-23); this takes it back. */
function pagePath(value) {
  if (!value) return value
  const v = value.replace(/\\/g, '/')
  const root = (process.env.EXEPATH ?? '').replace(/\\/g, '/').replace(/\/+$/, '')
  if (root && v.toLowerCase().startsWith(`${root.toLowerCase()}/`)) return v.slice(root.length)
  const m = v.match(/^[A-Za-z]:\/(?:.*\/)?Git(\/.*)$/)
  return m ? m[1] : value
}

const LOCK = join(ROOT, 'components', 'blocks', '.blocks-lock.json')
const readLock = () => (existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, 'utf8')) : {})
const installedVersion = (name) => readLock()[name]?.version ?? (existsSync(join(ROOT, 'components', 'blocks', `${name}.tsx`)) ? 'by hand' : null)

/** Insert `text` into `file` before the first line equal to `anchorLine` (trimmed match), keeping the file's line ends. */
function insertBefore(file, anchor, text) {
  const raw = readFileSync(file, 'utf8')
  const eol = raw.includes('\r\n') ? '\r\n' : '\n'
  const lines = raw.split(/\r?\n/)
  const i = lines.findIndex((l) => anchor(l))
  if (i < 0) return false
  lines.splice(i, 0, ...norm(text).split('\n'))
  writeFileSync(file, lines.join(eol), 'utf8')
  return true
}

if (cmd === 'find') {
  const need = positional[0]
  if (!need && !flag('collection')) die('find "<need in words>" [--role …] [--category …] [--collection …]')
  const base = await blocksUrl()
  const qs = new URLSearchParams({ q: need ?? '', element: ownAddress() ?? '' })
  for (const k of ['role', 'category', 'collection']) if (flag(k)) qs.set(k, flag(k))
  const out = await getJson(`${base}/api/block-find?${qs}`, true)
  if (!out.results.length) {
    console.log(`nothing in the catalogue for «${need}» — do not draw it by hand: npm run blocks -- request "${need}" --page <path>`)
  } else {
    for (const r of out.results) {
      const here = installedVersion(r.name)
      console.log(`${r.name}${r.inCollection ? '  [collection]' : ''}  — ${r.case ? `case «${r.case}»` : r.title}`)
      console.log(`    ${r.placement} · ${r.role}${r.repeat === 'once' ? ' · once per page' : ''} · ${here ? `installed here (${here})` : 'not installed here'}${r.conflicts?.length ? ` · ⚠ its card says avoid: ${r.conflicts.join(', ')}` : ''}`)
    }
    console.log(`see a block: npm run blocks -- show <block> · install: npm run blocks -- add <block>`)
  }
} else if (cmd === 'show') {
  const name = positional[0]
  if (!name) die('show <block>')
  const item = await getJson(`${(await blocksUrl())}/r/${name}.json`)
  const m = item.meta ?? {}
  console.log(`${item.name} v${m.version ?? '?'} — ${item.title}  [${(item.categories ?? []).join(', ')}]`)
  console.log(`use:       ${m.use}`)
  console.log(`avoid:     ${m.avoid}`)
  console.log(`placement: ${m.placement?.page ? (m.placement.inside?.length ? `standalone and inside ${m.placement.inside.join(', ')}` : 'standalone') : `only inside ${m.placement?.inside?.join(', ')}`}${m.accepts ? ` · accepts ${m.accepts.join(', ')}` : ''} · role ${m.role} · repeat ${m.repeat}`)
  console.log(`limits:    ${JSON.stringify(m.slots)}`)
  console.log(`data:      ${m.props}`)
  for (const [i, c] of (m.cases ?? []).entries()) {
    console.log(`case ${i + 1}:    ${c.title} — ${c.why}`)
    const props = JSON.stringify({ kind: m.pageKind ? item.name : undefined, ...c.props })
    console.log(`           ${props.length > 900 ? `${props.slice(0, 900)}…` : props}`)
  }
  console.log(`installed here: ${installedVersion(item.name) ?? 'no'} · ${item.docs ?? ''}`)
} else if (cmd === 'add') {
  const name = positional[0]
  if (!name) die('add <block> [--force]')
  const base = await blocksUrl()
  const item = await getJson(`${base}/r/${name}.json`)
  const card = { ...(item.meta ?? {}), name: item.name }
  const lock = readLock()
  const changed = []

  // 0. what the block needs from the node — checked before anything is written: a block whose element this node lacks is refused
  for (const req of card.requires ?? []) if (!(await nodeEntry(req))) die(`${name} needs the element «${req}», and this node has none — nothing was installed`)

  // 1. dependencies of the registry that the element does not have yet (never overwrite an existing file of the element)
  const seen = new Set()
  async function ensureDep(dep) {
    const depName = dep.replace(/^@fractera\//, '')
    if (seen.has(depName)) return
    seen.add(depName)
    const d = await getJson(`${base}/r/${depName}.json`)
    for (const f of d.files ?? []) {
      const target = join(ROOT, f.target)
      if (existsSync(target)) continue
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, f.content, 'utf8')
      changed.push(`${f.target} (dependency ${depName})`)
    }
    for (const dd of d.registryDependencies ?? []) await ensureDep(dd)
  }
  for (const dep of item.registryDependencies ?? []) await ensureDep(dep)

  // 2. the block's own files — a copy changed by hand stops the install
  const prev = lock[name]
  for (const f of item.files ?? []) {
    const target = join(ROOT, f.target)
    if (existsSync(target)) {
      const local = readFileSync(target, 'utf8')
      if (norm(local) === norm(f.content)) continue
      const ours = prev?.files?.[f.target] === sha(local)
      if (!ours && !has('force')) die(`${f.target} differs from the registry copy${prev ? ' and from what blocks add installed' : ' and was not installed by blocks add'} — changed by hand? Do not edit an installed block: request a variant (npm run blocks -- request "…"), or pass --force to replace it`)
    }
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, f.content, 'utf8')
    changed.push(f.target)
  }

  // 3. npm packages the block needs
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const missing = (item.dependencies ?? []).filter((d) => !(pkg.dependencies?.[d] || pkg.devDependencies?.[d]))
  if (missing.length) {
    const r = spawnSync('npm', ['install', ...missing], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32', windowsHide: true })
    if (r.status !== 0) die(`npm install ${missing.join(' ')} failed`)
    changed.push(`package.json (${missing.join(', ')})`)
  }

  // 4. a page kind is registered in the three places it lives — from its card, so no place is forgotten
  if (card.pageKind) {
    const component = card.component
    const set = join(ROOT, 'lib', 'content', 'blocks', 'registry.tsx')
    const types = join(ROOT, 'lib', 'content', 'blocks', 'types.ts')
    const md = join(ROOT, 'lib', 'aio', 'blocks-to-markdown.ts')
    if (!readFileSync(set, 'utf8').includes(`'${name}':`)) {
      const src = readFileSync(set, 'utf8')
      const importLine = `import { ${component} } from '@/components/blocks/${name}'`
      if (!src.includes(importLine)) insertBefore(set, (l) => l.startsWith("import type { Block }"), importLine)
      if (!insertBefore(set, (l) => l === '}' , `  '${name}': ${component},`)) die(`no closing line of BLOCK_SET in ${set}`)
      changed.push('lib/content/blocks/registry.tsx')
    }
    if (!readFileSync(types, 'utf8').includes(`kind: '${name}'`)) {
      const lines = readFileSync(types, 'utf8').split(/\r?\n/)
      const last = lines.map((l, i) => (l.trimStart().startsWith("| { kind: 'block-") ? i : -1)).filter((i) => i >= 0).pop()
      if (last === undefined) die(`no block kinds in the Block type of ${types}`)
      const anchor = lines[last + 1]
      if (!insertBefore(types, (l) => l === anchor, `  | ${card.props}`)) die(`could not place the type in ${types}`)
      changed.push('lib/content/blocks/types.ts')
    }
    if (card.markdown && !readFileSync(md, 'utf8').includes(`case '${name}'`)) {
      const text = card.markdown.split('\n').map((l, i) => (i === 0 ? `    ${l}` : l)).join('\n')
      if (!insertBefore(md, (l) => l.trim() === "case 'text-h2':", text)) die(`no anchor «case 'text-h2':» in ${md}`)
      changed.push('lib/aio/blocks-to-markdown.ts')
    }
  }

  // 5. the lock: what add wrote, to know later whether someone changed it by hand
  lock[name] = { version: card.version, files: Object.fromEntries((item.files ?? []).map((f) => [f.target, sha(readFileSync(join(ROOT, f.target), 'utf8'))])) }
  mkdirSync(dirname(LOCK), { recursive: true })
  writeFileSync(LOCK, `${JSON.stringify(lock, null, 2)}\n`, 'utf8')

  // 6. where it may stand
  if (card.placement && !card.placement.page) console.log(`⚠ ${name} stands only inside ${card.placement.inside.join(', ')}: put it into their children, not on the page by itself`)
  console.log(changed.length ? `===ADD_OK=== ${name} v${card.version}: ${changed.join(', ')}` : `===ADD_OK=== ${name} v${card.version}: already installed, nothing changed`)
  console.log(`next: copy a case into the page data — npm run blocks -- show ${name}`)
} else if (cmd === 'request') {
  const need = positional[0]
  if (!need) die('request "<need in words>" [--page <path>] [--project <id>]')
  const base = await blocksUrl()
  const body = { action: 'create', need, from: { ...(ownAddress() ? { element: ownAddress() } : {}), ...(flag('page') ? { page: pagePath(flag('page')) } : {}) }, ...(flag('project') ? { project: flag('project') } : {}) }
  const r = await fetch(`${base}/api/block-requests`, { method: 'POST', headers: { 'content-type': 'application/json', 'X-Node-Key': KEY }, body: JSON.stringify(body) }).catch((e) => die(`the Blocks element does not answer: ${e.cause?.code ?? e.message}`))
  const b = await r.json().catch(() => ({}))
  if (!r.ok) die(`${r.status} ${b.error ?? ''}: ${b.reason ?? ''}`)
  console.log(`===REQUEST_OK=== ${b.request.id} — the Blocks element will place it (stage 1 of the block lifecycle); until then use what exists`)
} else if (cmd === 'collection') {
  const project = positional[0]
  if (!project) die('collection <project>')
  const base = await blocksUrl()
  const out = await getJson(`${base}/api/block-find?${new URLSearchParams({ q: '', collection: project, element: ownAddress() ?? '' })}`, true)
  // `total` of the door counts every candidate of the catalogue; the collection is the members only.
  const members = out.results.filter((r) => r.inCollection)
  console.log(`collection ${project}: ${members.length} blocks`)
  for (const r of members) console.log(`  ${r.name} — ${r.placement} · ${installedVersion(r.name) ? 'installed here' : 'not installed here'}`)
  const req = await fetch(`${base}/api/block-requests`, { method: 'POST', headers: { 'content-type': 'application/json', 'X-Node-Key': KEY }, body: JSON.stringify({ action: 'list', project }) }).then((x) => x.json()).catch(() => ({}))
  for (const q of req.requests ?? []) console.log(`  request ${q.id} ${q.stage} — «${q.need}»`)
} else {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//   npm run blocks') || l.startsWith('//   any command')).map((l) => l.slice(3)).join('\n'))
  if (cmd) process.exit(1)
}
