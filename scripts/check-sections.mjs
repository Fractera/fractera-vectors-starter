#!/usr/bin/env node
// check:sections — THE GUARD OF EVERY SET OF SECTIONS (node step 717-3), in prebuild.
//
// A set is a folder of sections with its `index.ts` (`scripts/sections-lib.mjs`): the element's `components/sections/`, and a design
// prototype's own `prototypes/_pages/<id>/sections/` until the pin (`npm run design:pin` moves the winner's into the element's set).
// Both ways, for each set: every folder `section-*` has its import and its line in `index.ts`, every line has its folder, named by its
// kind; every folder holds `index.tsx`, `markdown.ts` and `README.md`. A prototype's kind never repeats a kind of the element: a
// prototype adds sections, it never replaces one. The generated wiring of the prototypes' sets is what their folders say.
// The archive of the prototypes (`prototypes/_archive/`) is history and holds no code — not read.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
// One guard for both templates: the native template has no design prototypes — then only the element's own set is held.
const PROTO = existsSync(new URL('./prototype-lib.mjs', import.meta.url)) ? await import('./prototype-lib.mjs') : null
const ID = PROTO?.ID ?? /^$/
const elementSectionsDir = () => join(process.env.ELEMENT_DIR?.trim() || process.cwd(), 'components', 'sections')
const pagesDir = () => PROTO?.pagesDir() ?? join(elementSectionsDir(), '__none__')
const sectionsDir = (id) => PROTO?.sectionsDir(id) ?? null
const wiringFresh = () => (PROTO ? PROTO.wiringFresh() : true)
import { readSet, repeatedKinds, setProblems } from './sections-lib.mjs'

const problems = setProblems(elementSectionsDir(), 'components/sections/')
const own = readSet(elementSectionsDir())?.lines.size ?? 0
let sets = 0
let theirs = 0
for (const n of existsSync(pagesDir()) ? readdirSync(pagesDir()).filter((x) => ID.test(x)) : []) {
  const dir = sectionsDir(n)
  if (!existsSync(dir)) continue
  const label = `app/[lang]/(protectedLayer)/prototypes/_pages/${n}/sections/`
  sets++
  theirs += readSet(dir)?.lines.size ?? 0
  problems.push(...setProblems(dir, label))
  for (const k of repeatedKinds(dir, elementSectionsDir())) problems.push(`${label}${k} repeats a section of the element — a prototype adds sections, it never replaces one: give the new look a new kind`)
}
// 717-4: a section is drawn into a static page — what makes a page dynamic or leaves the design tokens is refused in its code (the
// route-level guard check:static sees only route files, check:shadcn-rules only the Tailwind palette). A literal colour — `#hex`,
// `rgb(`, `hsl(` in a string — is a colour the person's design can never repaint.
const CODE_RULES = [
  [/\b(cookies|headers|draftMode)\s*\(\s*\)/, 'cookies()/headers() in a section — the page stops being static; an island asks /api/* after hydration'],
  [/force-dynamic|revalidate\s*=\s*0\b|\bnoStore\s*\(/, 'a dynamic switch in a section — the whole page is recomputed on every request'],
  [/["'`][^"'`\n]*(#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch)\s*\((?!\s*var\())[^"'`\n]*["'`]/, 'a literal colour in a section — take a design token (var(--…) or a token class)'],
]
const codeFiles = (dir) => readdirSync(dir).flatMap((n) => { const f = join(dir, n); return statSync(f).isDirectory() ? codeFiles(f) : /\.(ts|tsx)$/.test(n) ? [f] : [] })
const setDirs = [[elementSectionsDir(), 'components/sections/'], ...(existsSync(pagesDir()) ? readdirSync(pagesDir()).filter((x) => ID.test(x)).map((n) => [sectionsDir(n), `app/[lang]/(protectedLayer)/prototypes/_pages/${n}/sections/`]) : [])]
for (const [dir, label] of setDirs) {
  if (!existsSync(dir)) continue
  for (const f of codeFiles(dir)) {
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (/^\s*(\/\/|\*)/.test(line)) return
      for (const [re, why] of CODE_RULES) if (re.test(line)) problems.push(`${label}${f.slice(dir.length + 1)}:${i + 1}: ${why}`)
    })
  }
}
if (!wiringFresh()) problems.push("app/[lang]/(protectedLayer)/prototypes/_components/prototype-sections.ts is not what the prototypes' folders say — npm run prototype -- index")

if (problems.length) {
  console.error(`===SECTIONS_FAILED=== ${problems.length}\n  ${problems.join('\n  ')}`)
  console.error('A section is one folder named by its kind and one line of its set (components/sections/README.md).')
  process.exit(1)
}
console.log(`===SECTIONS_OK=== the element's set: ${own}; the prototypes' own sets: ${sets} (${theirs} sections)`)
