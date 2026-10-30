// INSTRUCTION GUARD OF THE ELEMENT (federal step 613, 2026-10-30): `npm run check:instruction`, part of `prebuild`.
//
// The same rule as the core's instruction (federal step 612), owner's words: «запретить какие-либо изменения … чтобы нормальные нашей
// инструкции никогда не превратилась бы в мусорку в процессе работы … ниже мы можем добавить дополнительную область который должно быть
// ограничена в 150 строк … по принципу if else maximum 25 слов».
// What it checks:
//   · the seal: sections 1–10 of `CLAUDE.md` (everything before «## 11. This element») and the rules of section 12 (up to `Entries:`)
//     match `scripts/instruction.seal` — they come from the template and change only with its new release;
//   · section 11 «This element» is the element's own and is not sealed;
//   · section 12 «Evolution» — at most 150 lines; each entry is one line `- If …` of at most 25 words;
//   · no tombstones (🪦) and no strike-through (~~) anywhere in the file.
// `--seal` rewrites the seal: only in the template, for a release, after the owner's word. `--file <path>` checks another file.

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null }
const SEAL = join(ROOT, 'scripts', 'instruction.seal')
const MAX_LINES = 150
const MAX_WORDS = 25

const text = readFileSync(arg('--file') ?? join(ROOT, 'CLAUDE.md'), 'utf8').replace(/\r\n/g, '\n')
const lines = text.split('\n')
const problems = []
const own = lines.findIndex((l) => l.startsWith('## 11. This element'))
const evo = lines.findIndex((l) => l.startsWith('## 12. Evolution'))
const entriesAt = lines.findIndex((l, i) => i > evo && l.trim() === 'Entries:')
if (own < 0) problems.push('no section «## 11. This element»')
if (evo < 0 || entriesAt < 0 || evo < own) problems.push('no section «## 12. Evolution» with the line «Entries:» after section 11')
const fixed = problems.length ? text : [...lines.slice(0, own), ...lines.slice(evo, entriesAt + 1)].join('\n')
const hash = createHash('sha256').update(fixed).digest('hex')

if (args.includes('--seal')) {
  if (problems.length) { console.log(`===INSTRUCTION_FAIL=== ${problems[0]}`); process.exit(1) }
  writeFileSync(SEAL, `${hash}\n`, 'utf8')
  console.log(`===INSTRUCTION_SEALED=== sections 1–10 and the rules of section 12: ${fixed.length} characters, seal ${hash.slice(0, 12)}`)
  process.exit(0)
}

const sealed = existsSync(SEAL) ? readFileSync(SEAL, 'utf8').trim() : ''
if (!sealed) problems.push('no seal scripts/instruction.seal')
else if (sealed !== hash) problems.push('sections 1–10 or the rules of section 12 changed without a seal: they change only with a new release of the template')
if (evo >= 0 && lines.length - evo > MAX_LINES) problems.push(`section 12 has ${lines.length - evo} lines, the limit is ${MAX_LINES}`)
for (const [i, l] of lines.entries()) {
  if (entriesAt < 0 || i <= entriesAt || !l.trim()) continue
  if (!/^- If /.test(l)) problems.push(`line ${i + 1} of section 12 is not an entry «- If …»: ${l.slice(0, 60)}`)
  const words = l.replace(/^- /, '').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
  if (words > MAX_WORDS) problems.push(`line ${i + 1}: ${words} words, the limit is ${MAX_WORDS}`)
}
for (const [i, l] of lines.entries()) if (/🪦|~~/.test(l)) problems.push(`line ${i + 1}: a tombstone or strike-through — what is outdated is removed, the history is git`)

const entries = entriesAt >= 0 ? lines.slice(entriesAt + 1).filter((l) => l.trim()).length : 0
if (problems.length) {
  for (const p of problems) console.log('✗ ' + p)
  console.log('===INSTRUCTION_FAIL===')
  process.exit(1)
}
console.log(`===INSTRUCTION_OK=== seal matches, section 12: ${lines.length - evo} lines of ${MAX_LINES}, entries ${entries}`)
