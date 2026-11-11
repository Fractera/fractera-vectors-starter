#!/usr/bin/env node
// MIGRATION «BLOCK → SECTION» (node step 717-2). The owner of the node, 2026-11-10: «избавиться от использования слова блоки и начать
// использовать слово секции»; «на основе твоего текущего исправления кастомного стартового шаблона сделать скрипт который просто
// выполнится автоматически исправит все остальные элементы».
//
// One element, its own folder, run by its own agent:
//   npm run migrate:sections               — the plan only: what it would move, rename and leave for your eye; writes nothing
//   npm run migrate:sections -- --apply    — does it and writes development-docs/reports/migration-sections-<date>.md
// Every rename is data — scripts/migrate-sections.map.json. What a script cannot judge (the word «block» in a sentence of your own)
// is listed in the report with its line: read each, change the sense «section», keep the sense «address» (`data-block`). Then
// `npm run prebuild`, `npx tsc --noEmit`, the build, eyes on your pages, one commit. An element already migrated is told so.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const CHECK = args.includes('--check') // the guard `check:words`: the same scan, no second list
const at = args.indexOf('--dir')
const ROOT = resolve(at >= 0 ? args[at + 1] : process.cwd())
const MAP = JSON.parse(readFileSync(join(HERE, 'migrate-sections.map.json'), 'utf8'))

const abs = (p) => join(ROOT, p)
const out = new Map() // path → new text, or null for a deleted file
const isFile = (p) => existsSync(abs(p)) && statSync(abs(p)).isFile()
const get = (p) => (out.has(p) ? out.get(p) : isFile(p) ? readFileSync(abs(p), 'utf8') : null)
const put = (p, s) => out.set(p, s)
const del = (p) => out.set(p, null)
const done = [] // what was done, for the report
const eye = [] // { file, line, text, why } — for the element's agent
const note = (s) => done.push(s)
const look = (file, line, text, why) => eye.push({ file, line, text: text.trim().slice(0, 200), why })

const listed = () => {
  const disk = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)
  const all = new Set([...disk, ...out.keys()])
  return [...all].filter((f) => get(f) !== null).filter((f) => !MAP.skip.some((s) => f.startsWith(s) || f === s))
}
const vendored = (f) => {
  const m = /^\.claude\/skills\/([^/]+)\//.exec(f)
  return Boolean(m) && existsSync(abs(`.claude/skills/${m[1]}/SOURCE.md`))
}
const CODE = /\.(ts|tsx|mjs|cjs|js)$/
const newKind = (k) => MAP.kinds.special[k] ?? k.replace(new RegExp(`^${MAP.kinds.from}`), MAP.kinds.to)
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// ── 0. Which layout is this ──────────────────────────────────────────────────────────────────────────────────────────────
const old = get(MAP.registry)
if (old === null) {
  const fresh = get('components/sections/index.ts') !== null
  if (!CHECK) console.log(fresh ? 'Already migrated: components/sections/index.ts holds the set. Leftover words, if any, are listed below.' : 'No lib/content/blocks/registry.tsx and no components/sections/index.ts: an unknown layout — nothing is moved.')
}

// ── 1. The sections of the old set: kind, component, file ──────────────────────────────────────────────────────────────
const sections = []
if (old !== null) {
  const imports = new Map([...old.matchAll(/import\s*\{\s*([A-Za-z0-9_]+)\s*\}\s*from\s*['"]@\/components\/blocks\/([a-z0-9-]+)['"]/g)].map((m) => [m[1], m[2]]))
  for (const m of old.matchAll(/['"](block-[a-z0-9-]+)['"]\s*:\s*([A-Za-z0-9_]+)\s*,?/g)) {
    const s = { old: m[1], kind: newKind(m[1]), comp: m[2], file: imports.get(m[2]) }
    if (!s.file) look(MAP.registry, 0, m[0], 'the set names a component that is not imported from components/blocks/ — move it into components/sections/<kind>/ by hand')
    else sections.push(s)
  }
  const own = old.replace(/^\s*(import .*|\/\/.*|\/\*\*.*\*\/|\s*)$/gm, '')
  if (/export\s+(?!const BLOCK_SET|function renderBlocks)/.test(own)) look(MAP.registry, 0, 'registry.tsx', 'the old set file exports more than the set and renderBlocks — carry your own code into components/sections/page-body.tsx')
}

// ── 2. Each section's fields (its line of the old union) and its words for the Markdown twin (its case of the old switch) ─
const types = get(MAP.types)
const md = get(MAP.markdown)
const mdLines = md ? md.split('\n') : []
const cut = [] // line ranges of the switch that move into the folders
for (const s of sections) {
  const t = types && new RegExp(`^\\s*\\|\\s*\\{\\s*kind:\\s*'${esc(s.old)}'\\s*;?\\s*(.*?)\\s*\\}\\s*$`, 'm').exec(types)
  s.shape = t ? t[1].replace(/;\s*$/, '').trim() : null
  if (!s.shape && s.shape !== '') look(MAP.types, 0, s.old, 'no one-line member of the union for this kind — write `export type Shape` in its folder by hand')
  const i = mdLines.findIndex((l) => new RegExp(`^\\s*case\\s+'${esc(s.old)}'\\s*:\\s*\\{?\\s*$`).test(l))
  if (i < 0) { s.md = null; look(MAP.markdown, 0, s.old, 'no case for this kind in the old switch — write its markdown.ts by hand (the set does not compile without it)'); continue }
  let j = i + 1
  while (j < mdLines.length && !/^\s*(case\s|default\s*:)/.test(mdLines[j])) j++
  let end = j
  while (end > i + 1 && /^\s*(\/\/.*)?$/.test(mdLines[end - 1])) end-- // a comment there introduces the next case — it stays
  let body = mdLines.slice(i + 1, end)
  if (/\{\s*$/.test(mdLines[i]) && /^\s*\}\s*$/.test(body[body.length - 1] ?? '')) body = body.slice(0, -1)
  const ind = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length))
  // 717-9: the old switch named the item by its own parameter (`block`, `b` …); in the folder the function's parameter is `section`
  const param = /switch\s*\(\s*(\w+)\.kind\s*\)/.exec(md ?? "")?.[1]
  const rename = (l) => (param && param !== 'section' ? l.replace(new RegExp(`\\b${param}\\b`, 'g'), 'section') : l)
  s.md = body.map((l) => (l.trim() ? '  ' + rename(l.slice(ind)) : ''))
  cut.push([i, end])
}

// ── 3. One folder per section ──────────────────────────────────────────────────────────────────────────────────────────
const readme = get(MAP.sectionsReadme) ?? ''
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
for (const s of sections) {
  const from = `components/blocks/${s.file}.tsx`
  const code = get(from)
  if (code === null) { look(from, 0, s.file, 'the set imports a file that does not exist'); continue }
  const dir = `components/sections/${s.kind}`
  const shape = s.shape === null ? '/* write the fields of this section in page data */' : s.shape
  put(`${dir}/index.tsx`, code.replace(/\s*$/, '\n') + [
    '',
    '// 717-2: the set (`components/sections/index.ts`) reads this section by these names — the component, its fields in page data',
    '// and its words in the Markdown twin (`./markdown.ts`).',
    ...(s.comp === 'Section' ? [] : [`export { ${s.comp} as Section }`]),
    `export type Shape = { ${shape} }`,
    `export { markdown } from './markdown'`,
    '',
  ].join('\n'))
  if (s.md) {
    put(`${dir}/markdown.ts`, [
      `import type { Shape } from './index'`,
      '',
      `// The words of this section in the page's Markdown twin (717-2: its case of the old switch of the twin, moved here).`,
      `export function markdown(section: Shape): string[] {`,
      ...s.md,
      '}',
      '',
    ].join('\n'))
  }
  const row = new RegExp(`^\\|\\s*\`${esc(s.file)}\\.tsx\`\\s*\\|\\s*(.+?)\\s*\\|\\s*$`, 'm').exec(readme)
  put(`${dir}/README.md`, [
    `# \`${s.kind}\``,
    '',
    `${row ? cap(row[1]).replace(/\.?$/, '.') : 'A section of this element.'}`,
    '',
    '| File | What |',
    '|---|---|',
    '| `index.tsx` | the component the page\'s factory draws, and `Shape` — its fields in page data |',
    '| `markdown.ts` | its words in the page\'s Markdown twin |',
    '',
  ].join('\n'))
  del(from)
  note(`section \`${s.old}\` → folder \`${dir}/\` (index.tsx, markdown.ts, README.md)`)
}

// ── 4. The set: components/sections/index.ts ───────────────────────────────────────────────────────────────────────────
if (old !== null) {
  const id = (k) => k.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
  put('components/sections/index.ts', [
    `import type { ReactNode } from 'react'`,
    ...sections.map((s) => `import * as ${id(s.kind)} from './${s.kind}'`),
    '',
    `// THE SECTIONS OF THIS ELEMENT (node step 717-2). A section is one folder named by its kind: its component and its fields in page`,
    `// data (\`index.tsx\`), its words in the Markdown twin (\`markdown.ts\`) and its README. A new section — its folder here and its line`,
    `// below; a folder without \`markdown\` does not compile, so the twin never loses a section's words.`,
    '',
    'export type SectionModule = {',
    '  // eslint-disable-next-line @typescript-eslint/no-explicit-any',
    '  Section: (props: any) => ReactNode',
    '  // eslint-disable-next-line @typescript-eslint/no-explicit-any',
    '  markdown: (section: any) => string[]',
    '}',
    '',
    'export const SECTIONS = {',
    ...sections.map((s) => `  '${s.kind}': ${id(s.kind)},`),
    '} satisfies Record<`section-${string}`, SectionModule>',
    '',
    `/** A section in a page's body: its kind and its fields. */`,
    'export type SectionItem = {',
    `  [K in keyof typeof SECTIONS]: { kind: K } & Parameters<(typeof SECTIONS)[K]['markdown']>[0]`,
    '}[keyof typeof SECTIONS]',
    '',
    `export const isSection = (kind: string): kind is keyof typeof SECTIONS => Object.prototype.hasOwnProperty.call(SECTIONS, kind)`,
    '',
  ].join('\n'))
  note('the set `components/sections/index.ts` (one line per section; the type of a section item derived from it)')
}

// ── 5. The old union loses its section lines and gains SectionItem ─────────────────────────────────────────────────────
if (types !== null && old !== null) {
  let t = types
  for (const s of sections) t = t.replace(new RegExp(`^\\s*\\|\\s*\\{\\s*kind:\\s*'${esc(s.old)}'.*\\n`, 'm'), '')
  t = t.replace(/^(export type Block = Addressed & \()\s*$/m, `$1\n  // 717-2: the sections of this element — their fields live in their folders (\`components/sections/<kind>/index.tsx\`).\n  | SectionItem`)
  if (!/\| SectionItem/.test(t)) look(MAP.types, 0, 'export type Block = …', 'the union was not found in its usual form — add `| SectionItem` to the type of a page item by hand')
  t = `import type { SectionItem } from '@/components/sections'\n` + t
  put(MAP.types, t)
}

// ── 6. The old switch: the sections' cases are gone, a section answers from its own folder ─────────────────────────────
if (md !== null && old !== null) {
  const lines = [...mdLines]
  for (const [a, b] of [...cut].sort((x, y) => y[0] - x[0])) lines.splice(a, b - a)
  let m = lines.join('\n')
  m = m.replace(/(function lines\([^)]*\)[^{]*\{\n)/, `$1  // 717-2: a section brings its own words (\`components/sections/<kind>/markdown.ts\`).\n  if (isSection(block.kind)) return (SECTIONS[block.kind].markdown as (s: unknown) => string[])(block)\n`)
  if (!/isSection\(block\.kind\)/.test(m)) look(MAP.markdown, 0, 'function lines(…)', 'the twin did not get the line that asks a section for its words — add it by hand')
  m = `import { SECTIONS, isSection, type SectionItem } from '@/components/sections'\n` + m
  m = m.replace(/const section = block as Exclude<Block, \{ kind: `widget-\$\{string\}` \}>/, 'const section = block as Exclude<Block, { kind: `widget-${string}` } | SectionItem>')
  if (!/\| SectionItem>/.test(m)) look(MAP.markdown, 0, 'const section = block as …', 'the narrowing of the switch was not found — exclude SectionItem from its type by hand')
  put(MAP.markdown, m)
}

// ── 7. The page's factory: the folder's set, renderPage ────────────────────────────────────────────────────────────────
if (old !== null && get(MAP.pageBody) !== null) {
  let p = get(MAP.pageBody)
  p = p.replace(/const Block = set\[/, 'const Draw = set[').replace(/if \(!Block\)/, 'if (!Draw)').replace(/<Block /g, '<Draw ').replace(/<\/Block>/g, '</Draw>')
  p = p.replace(/write it in components\/blocks\/, list it in lib\/content\/blocks\/registry\.tsx/, 'write its folder components/sections/${b.kind}/, list it in components/sections/index.ts')
  p = p.replace(/^(import type \{ ReactNode \} from 'react')$/m, `$1\nimport { SECTIONS } from './index'\nimport { TEXT_SET } from '@/lib/content/text-set'`)
  p = p.replace(/\s*$/, '\n') + [
    '',
    '// 717-2: what `lib/content/blocks/registry.tsx` did — the sections of this element (`./index.ts`), the element\'s typography and the',
    '// branch\'s widgets, drawn in the order of the page\'s body; `keyPrefix` keeps the keys unique between calls on one page.',
    'export const SECTION_SET: BlockSet = Object.fromEntries(Object.entries(SECTIONS).map(([kind, m]) => [kind, m.Section]))',
    '',
    `export function renderBlocks(blocks: BlockData[], keyPrefix = 'blk', widgets?: BlockSet): ReactNode {`,
    '  return <PageBody key={keyPrefix} blocks={blocks} set={{ ...SECTION_SET, ...TEXT_SET, ...(widgets ?? {}) }} />',
    '}',
    '',
  ].join('\n')
  put(MAP.pageBody, p)
  del(MAP.registry)
  note('the page\'s factory `components/sections/page-body.tsx` draws the set of the folders (`renderPage`); `lib/content/blocks/registry.tsx` is gone')
}

// ── 8. Moves ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const moved = new Map() // old module (no extension) → new module
const origin = new Map() // new file → the file it came from: its relative imports are read from there
for (const [from, to] of MAP.moves) {
  const text = get(from)
  if (text === null) continue
  if (get(to) !== null) { look(to, 0, to, `both ${from} and ${to} exist — merge by hand`); continue }
  put(to, text)
  del(from)
  moved.set(from.replace(/\.(tsx?|mjs)$/, ''), to.replace(/\.(tsx?|mjs)$/, ''))
  origin.set(to, from)
  note(`moved \`${from}\` → \`${to}\``)
}
for (const s of sections) {
  moved.set(`components/blocks/${s.file}`, `components/sections/${s.kind}`)
  origin.set(`components/sections/${s.kind}/index.tsx`, `components/blocks/${s.file}.tsx`)
}
for (const [from, to] of MAP.modules) moved.set(from, to)

// ── 9. A dead file of the old folders goes ─────────────────────────────────────────────────────────────────────────────
const resolveSpec = (file, spec) => {
  if (spec.startsWith('@/')) return spec.slice(2)
  if (spec.startsWith('.')) return posix.normalize(posix.join(posix.dirname(file), spec))
  return null
}
const SPEC = /(from\s*|import\s*\(\s*|require\s*\(\s*)(['"])([^'"]+)\2/g
const exists = (m) => ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts', '/index.tsx'].some((x) => get(m + x) !== null)
for (const dead of MAP.deadIfUnused) {
  if (get(dead) === null) continue
  const base = dead.replace(/\.(tsx?|mjs)$/, '')
  const users = listed().filter((f) => CODE.test(f) && f !== dead).filter((f) => [...get(f).matchAll(SPEC)].some((m) => resolveSpec(f, m[3]) === base))
  if (users.length) look(dead, 0, dead, `still imported by ${users.join(', ')} — move it with them by hand`)
  else { del(dead); note(`deleted \`${dead}\` — imported by nobody`) }
}

// ── 10. Code: imports, paths, kinds, names, the page's body ─────────────────────────────────────────────────────────────
const keep = new Set(MAP.keepBlocksWord.files)
// `block-faq`, `'block-'`, `block-*`, `block-<name>` — every kind; `block-highlight` and the others of `keep` are not kinds
const kindRe = new RegExp(`(?<![\\w-])${esc(MAP.kinds.from)}(?!${MAP.kinds.keep.map((k) => esc(k.slice(MAP.kinds.from.length))).join('|')})`, 'g')
const doubled = new RegExp(`${esc(MAP.kinds.to)}${esc(MAP.kinds.to.replace(/-$/, ''))}-`, 'g') // section-section-head → section-head
// a path (`./blocks.tsx`), the npm command `blocks:ids` and the CONFIG key `blocks.hero…` are not a page's list
const bodyRe = new RegExp(`(?<![\\w$/-])${MAP.pageKey.from}(?![\\w$-]|:ids|\\.hero|\\.tsx?\\b|\\.example)`, 'g')
// words people read (`*.i18n.ts`) are never renamed by a script: they go to the eye
const WORDS = /(\.i18n\.ts|\/_i18n\/[^/]+\.ts)$/
for (const f of listed()) {
  if (vendored(f)) continue
  const isCode = CODE.test(f)
  const isJson = f.endsWith('.json')
  if (!isCode && !isJson && !/\.(md|txt)$/.test(f)) continue
  const before = get(f)
  let t = before
  if (isCode) {
    const from = origin.get(f) ?? f
    t = t.replace(SPEC, (all, lead, q, spec) => {
      // a neighbour that exists at the new place (the folder's own `./markdown`, `./index`) stays as it is
      if (spec.startsWith('.') && exists(resolveSpec(f, spec))) return all
      const r = resolveSpec(from, spec)
      if (r === null) return all
      const hit = moved.get(r) ?? moved.get(r.replace(/\/index$/, ''))
      if (hit) return `${lead}${q}@/${hit}${q}`
      // a moved file keeps its neighbours: a relative import is read from its old place and written absolute
      return origin.has(f) && spec.startsWith('.') ? `${lead}${q}@/${r}${q}` : all
    })
  }
  if (isCode || /\.md$/.test(f)) for (const [a, b] of MAP.paths) t = t.split(a).join(b)
  if (isCode || /\.md$/.test(f)) t = t.replace(kindRe, MAP.kinds.to).replace(doubled, MAP.kinds.to)
  if (isJson && /^app\//.test(f)) {
    t = t.replace(/("kind"\s*:\s*")block-/g, '$1section-').replace(doubled, MAP.kinds.to)
    // 717-9: an item's own key in page data (`"blockKey": "uses"`) is read by the code as `itemKey` now — left as it was, it is
    // silently ignored and the section's anchor changes (found on the graph starter's cards)
    t = t.replace(/"blockKey"(\s*:)/g, '"itemKey"$1')
    let top = null
    try { top = JSON.parse(t) } catch { /* not JSON — left */ }
    if (top && Array.isArray(top[MAP.pageKey.from])) {
      const n = (t.match(new RegExp(`"${MAP.pageKey.from}"\\s*:`, 'g')) ?? []).length
      if (n === 1) t = t.replace(new RegExp(`"${MAP.pageKey.from}"(\\s*:)`), `"${MAP.pageKey.to}"$1`)
      else look(f, 0, `"${MAP.pageKey.from}"`, `${n} keys «${MAP.pageKey.from}» — rename only the page's own, at the top level, to «${MAP.pageKey.to}»`)
    }
  }
  if (isCode && !WORDS.test(f)) {
    for (const [a, b] of MAP.names) {
      const re = new RegExp(`(?<![\\w$.-])${esc(a)}(?![\\w$-])`, 'g')
      if (a === 'Block') t = t.split('\n').map((l) => (/^\s*(\/\/|\*|\/\*)/.test(l) ? l : l.replace(re, b))).join('\n')
      else t = t.replace(re, b)
    }
    let n = 0
    // the guard's own name of the old key (`const OLD_KEY = 'blocks'`) stays: it is how the guard recognises a page not migrated
    if (!keep.has(f)) t = t.split('\n').map((l) => (/OLD_KEY\s*=/.test(l) ? l : l.replace(bodyRe, () => (n++, MAP.pageKey.to)))).join('\n')
    if (n) note(`\`${f}\`: «${MAP.pageKey.from}» → «${MAP.pageKey.to}» ${n}× — the page's list; read the file if one of them meant something else`)
    if (f === 'scripts/check-content.mjs') t = t.replace(/"registry"(, "resolve")/, '"page-body"$1')
  }
  if (t !== before) { put(f, t); if (!done.some((d) => d.includes(`\`${f}\``))) note(`rewritten \`${f}\``) }
}

// ── 11. What stays in the old folders, and every word «block» left for an eye ─────────────────────────────────────────
for (const d of MAP.oldDirs) for (const f of listed().filter((x) => x.startsWith(d + '/'))) look(f, 0, f, 'a file still lives in an old folder — move it where it belongs (a section → components/sections/<kind>/)')
const allowed = new RegExp(MAP.allowed.patterns.join('|'), 'gi')
// «блок» only as a word of its own — «Яблоко» holds the same four letters (found on the template: lib/db/index.ts)
const word = /\bblocks?\b|\bBlocks?\b|\bBLOCKS?\b|(?<![А-Яа-яЁё])[Бб]лок/
const quoted = /«[^»]*»/g // the owner's words stay verbatim
const utility = /(?<=["'`\s:])block(?=[\s"'`])/g // Tailwind's `block` in a className
// a string of Tailwind classes (`"pointer-events-none block size-4 …"`): its `block` is a CSS display, not a section
const classes = /(["'`])(?=[^"'`]*\b[a-z]+-[a-z0-9[\]().:/-]+)[^"'`]*\1/g
const leftover = (l) => {
  let s = l.replace(quoted, '').replace(allowed, '')
  if (/classname|class=|\bcn\(/i.test(s)) s = s.replace(utility, '')
  s = s.replace(classes, (str) => str.replace(/\bblock\b/g, ''))
  return word.test(s)
}
for (const f of listed()) {
  if (vendored(f) || !/\.(ts|tsx|mjs|cjs|js|md|json|txt)$/.test(f)) continue
  if ((MAP.allowed.files ?? []).some((p) => f.startsWith(p))) continue
  const t = get(f)
  t.split('\n').forEach((l, i) => {
    if (leftover(l)) look(f, i + 1, l, '«block» left — the sense «section» becomes «section»; the address (`data-block`) stays')
  })
}

// ── 12. The guard (`npm run check:words`, part of prebuild) ───────────────────────────────────────────────────────────────
if (CHECK) {
  if (old !== null) {
    console.error('===WORDS_FAILED=== this element still has the old layout (lib/content/blocks/registry.tsx): npm run migrate:sections -- --apply')
    process.exit(1)
  }
  // the scan above reads the files as the migration would leave them: anything it would still change is the old layout on disk
  if (done.length) {
    console.error(`===WORDS_FAILED=== the old words still stand — ${done.length} change(s) to make (npm run migrate:sections shows them, -- --apply makes them):`)
    for (const d of done.slice(0, 20)) console.error(`  ${d}`)
    process.exit(1)
  }
  if (eye.length) {
    console.error(`===WORDS_FAILED=== «block» in the sense of a section: ${eye.length} line(s)`)
    for (const e of eye.slice(0, 40)) console.error(`  ${e.file}${e.line ? `:${e.line}` : ''}: ${e.text}`)
    console.error('Write «section» («секция»); the address of a container keeps `data-block`. What may stay and why — scripts/migrate-sections.map.json, «allowed».')
    process.exit(1)
  }
  console.log('===WORDS_OK=== «block» stands only for the address of a container or a word of another trade')
  process.exit(0)
}

// ── 13. Do it, or show it ──────────────────────────────────────────────────────────────────────────────────────────────
const date = new Date().toISOString().slice(0, 10)
const report = [
  `# Migration «block → section» — ${date}`,
  '',
  `Node step 717-2: one word, «section», for a designed part of a page; a section is one folder \`components/sections/<kind>/\`; a page's`,
  `list is \`body\`. «Block» keeps one meaning — the address of a container (\`data-block\`, \`#block=\`, \`npm run blocks:ids\`).`,
  `Script \`scripts/migrate-sections.mjs\`, map \`scripts/migrate-sections.map.json\`.`,
  '',
  `## Done (${done.length})`,
  '',
  ...done.map((d) => `- ${d}`),
  '',
  `## For your eye (${eye.length})`,
  '',
  'Each line: change the sense «section» to «section» (in Russian «секция»), keep the address; a line that is right as it is stays.',
  '',
  // the quoted line goes in «…»: the element's guard of development documents allows another language only inside them
  ...eye.map((e) => `- \`${e.file}${e.line ? `:${e.line}` : ''}\` — ${e.why}: «${e.text.replace(/`/g, "'").replace(/[«»]/g, '"')}»`),
  '',
  '## Then',
  '',
  '`npm run prebuild`, `npx tsc --noEmit`, the build, `npm run eyes` on a page with sections, one commit.',
  '',
].join('\n')
if (APPLY) {
  for (const [p, t] of out) {
    if (t === null) { rmSync(abs(p), { force: true }); continue }
    mkdirSync(dirname(abs(p)), { recursive: true })
    writeFileSync(abs(p), t)
  }
  for (const d of MAP.oldDirs) {
    try { if (execFileSync('ls', ['-A', abs(d)], { encoding: 'utf8' }).trim() === '') rmSync(abs(d), { recursive: true }) } catch { /* gone */ }
  }
  const rp = `development-docs/reports/migration-sections-${date}.md`
  mkdirSync(dirname(abs(rp)), { recursive: true })
  writeFileSync(abs(rp), report)
  console.log(`===MIGRATE_SECTIONS_DONE=== ${done.length} done, ${eye.length} for your eye — ${rp}`)
} else {
  console.log(report)
  console.log(`===MIGRATE_SECTIONS_PLAN=== ${done.length} to do, ${eye.length} for your eye — nothing written; --apply does it`)
}
