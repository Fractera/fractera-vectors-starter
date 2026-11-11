// Guard of the rule «our architecture, never theirs» (node step 590-3). Run: node scripts/check-architecture-rule.mjs (part of prebuild).
//
// The owner of the node, 2026-10-23: «элементы интерфейса и бизнес логики мы пере используем а техническую архитектуру сохраняем
// собственную и это должно быть прописано на уровне каждого документа как правило которые нельзя отменить». «Cannot be cancelled» is
// kept by code, not by memory: every document of the path from a study to code that this element has carries the rule word for word,
// in the paragraph right under the line <!-- RULE: our-architecture -->, and the build fails when one lost it or changed it. The words
// live once — scripts/our-architecture.mjs; `.claude/modes/build.md` must exist, the other documents are checked where they exist (a
// removed skill folder is what check-tree sees).
import fs from 'node:fs'
import path from 'node:path'
import { OUR_ARCHITECTURE, flat } from './our-architecture.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const ANCHOR = '<!-- RULE: our-architecture -->'
// A build skill's file from its name: the list names skills an element may not have (product-clone lives only in custom elements),
// so it holds names, not paths that would point nowhere in this element.
const buildSkill = (name) => ['.claude', 'skills', 'build-skills', 'skills', name, 'SKILL.md'].join('/')
const DOCS = ['.claude/modes/build.md', '.claude/modes/build-design.md', ...['product-quiz', 'product-clone'].map(buildSkill)]
const REQUIRED = new Set(['.claude/modes/build.md'])
const want = flat(OUR_ARCHITECTURE)
const problems = []
let checked = 0
for (const rel of DOCS) {
  const file = path.join(ROOT, rel)
  if (!fs.existsSync(file)) {
    if (REQUIRED.has(rel)) problems.push(`${rel} is missing`)
    continue
  }
  checked++
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  const at = lines.findIndex((l) => l.trim() === ANCHOR)
  if (at < 0) { problems.push(`${rel} — the rule is gone: no line ${ANCHOR}`); continue }
  const para = []
  for (let i = at + 1; i < lines.length && lines[i].trim() !== ''; i++) para.push(lines[i].replace(/^\s*>\s?/, ''))
  if (flat(para.join(' ')) !== want) problems.push(`${rel} — the paragraph under ${ANCHOR} is not the rule of scripts/our-architecture.mjs word for word`)
}
if (problems.length) {
  console.error(`===ARCHITECTURE_RULE_FAIL=== ${problems.length} problem(s):`)
  for (const p of problems) console.error('  ' + p)
  process.exit(1)
}
console.log(`===ARCHITECTURE_RULE_OK=== the rule stands word for word in ${checked} document(s)`)
