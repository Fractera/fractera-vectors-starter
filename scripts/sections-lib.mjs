// THE SETS OF SECTIONS (node step 717-3) — one reader for the guard `check:sections`, the guard `check:page-sequence` and
// `npm run prototype` (`design:pin`). A set is a folder of sections: the element's `components/sections/`, and a design prototype's
// own `prototypes/_pages/<id>/sections/` until the pin. Its `index.ts` names each section once — an import of the section's folder and
// a line `'<kind>': <name>,` — and every section is a folder named by its kind, with `index.tsx`, `markdown.ts` and `README.md`.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const KIND = /^section-[a-z0-9]+(?:-[a-z0-9]+)*$/
export const SECTION_FILES = ['index.tsx', 'markdown.ts', 'README.md']

/** The set's lines: kind → the folder its import names (`'./section-x'` → `section-x`), or null when it names no folder import. */
export function readSet(dir) {
  const file = join(dir, 'index.ts')
  if (!existsSync(file)) return null
  const text = readFileSync(file, 'utf8')
  const imports = new Map([...text.matchAll(/import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+'\.\/([^']+)'/g)].map((m) => [m[1], m[2]]))
  const lines = new Map()
  for (const m of text.matchAll(/'(section-[a-z0-9-]+)'\s*:\s*([A-Za-z_$][\w$]*)/g)) lines.set(m[1], imports.get(m[2]) ?? null)
  return { file, text, lines }
}

/** The folders of a set: every directory here whose name starts with `section-`. */
export function setFolders(dir) {
  if (!dir || !existsSync(dir)) return []
  return readdirSync(dir).filter((n) => n.startsWith('section-') && statSync(join(dir, n)).isDirectory()).sort()
}

/** What is wrong with one set, both ways: a folder without its line, a line without its folder, a folder without its files. */
export function setProblems(dir, label) {
  const out = []
  const set = readSet(dir)
  const folders = setFolders(dir)
  if (!set) return folders.length ? [`${label}index.ts is missing — the set names every section of this folder`] : []
  for (const f of folders) {
    if (!KIND.test(f)) out.push(`${label}${f}/ — a kind is section-<lowercase words joined by dashes>`)
    if (!set.lines.has(f)) out.push(`${label}${f}/ is not in the set — add \`import * as ${nameOf(f)} from './${f}'\` and \`'${f}': ${nameOf(f)},\` to ${label}index.ts`)
    for (const x of SECTION_FILES) if (!existsSync(join(dir, f, x))) out.push(`${label}${f}/${x} is missing — a section is its component, its Markdown words and its README`)
  }
  for (const [kind, folder] of set.lines) {
    if (folder === null) out.push(`${label}index.ts: «${kind}» names no import of a folder of this set`)
    else if (folder !== kind) out.push(`${label}index.ts: «${kind}» imports './${folder}' — a section's folder is named by its kind`)
    else if (!folders.includes(folder)) out.push(`${label}index.ts: «${kind}» has no folder ${label}${folder}/`)
  }
  return out
}

/** The import name of a kind, as the set writes it: `section-hero-calm` → `sectionHeroCalm`. */
export function nameOf(kind) {
  return kind.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
}

/** Adds a section's import and line to a set (`index.ts` of the element): the import after the last folder import, the line last. */
export function addToSet(dir, kind) {
  const set = readSet(dir)
  if (!set) throw new Error(`${dir}/index.ts is missing`)
  if (set.lines.has(kind)) return false
  let name = nameOf(kind)
  for (let i = 2; new RegExp(`\\b${name}\\b`).test(set.text); i++) name = `${nameOf(kind)}${i}`
  const lines = set.text.split('\n')
  const lastImport = lines.reduce((at, l, i) => (/^import\s+\*\s+as\s+\w+\s+from\s+'\.\//.test(l) ? i : at), -1)
  const open = lines.findIndex((l) => /^export const SECTIONS = \{/.test(l))
  const close = open < 0 ? -1 : lines.findIndex((l, i) => i > open && /^\}/.test(l))
  if (close < 0) throw new Error(`${set.file}: no \`export const SECTIONS = {\` … \`}\` to add «${kind}» to`)
  lines.splice(close, 0, `  '${kind}': ${name},`)
  lines.splice(lastImport >= 0 ? lastImport + 1 : lines.findIndex((l) => /^import /.test(l)) + 1, 0, `import * as ${name} from './${kind}'`)
  writeFileSync(set.file, lines.join('\n'), 'utf8')
  return true
}

/** The kinds of a set (its folders and its lines) that the base set already has — a prototype adds sections, it never replaces one. */
export function repeatedKinds(dir, baseDir) {
  const base = new Set([...(readSet(baseDir)?.lines.keys() ?? []), ...setFolders(baseDir)])
  return [...new Set([...setFolders(dir), ...(readSet(dir)?.lines.keys() ?? [])])].filter((k) => base.has(k)).sort()
}

/** The folders of page data under `app/[lang]` — every folder with an `en.json`; the prototypes' archive is history and not read. */
export function pageFolders(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (!statSync(p).isDirectory() || ['node_modules', '_widgets', '_components', '_libs', '_archive'].includes(name)) continue
    if (existsSync(join(p, 'en.json'))) out.push(p)
    pageFolders(p, out)
  }
  return out
}

/** The kinds a page's data names (every language file of its folder). */
export function kindsOfPage(dir) {
  const kinds = new Set()
  for (const f of readdirSync(dir).filter((x) => /^[a-z]{2}\.json$/.test(x))) {
    try {
      const walk = (items) => { for (const b of Array.isArray(items) ? items : []) { if (typeof b?.kind === 'string') kinds.add(b.kind); walk(b?.children) } }
      walk(JSON.parse(readFileSync(join(dir, f), 'utf8')).body)
    } catch { /* a broken file is check:page-sequence's to name */ }
  }
  return kinds
}
