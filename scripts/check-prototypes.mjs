// СТОРОЖ ПРОТОТИПОВ ДИЗАЙНА (узел, шаг 711-4): у каждого прототипа — правильная запись, токены той же формы, что `DESIGN-CONFIG`, и ни
// одного цвета в словах страницы: облик прототипа берётся только из его `tokens.json`, иначе закрепление перенесло бы не то, что видно.
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ID, LANG, colourLeaks, pagesDir, readJson, recordProblems, tokenProblems } from './prototype-lib.mjs'

const root = pagesDir()
const ids = existsSync(root) ? readdirSync(root).filter((n) => ID.test(n)) : []
const errors = []
for (const id of ids) {
  const dir = join(root, id)
  errors.push(...recordProblems(readJson(join(dir, 'prototype.json')), id).map((e) => `${id}: ${e}`))
  if (existsSync(join(dir, 'tokens.json'))) errors.push(...tokenProblems(readJson(join(dir, 'tokens.json'))).map((e) => `${id}: ${e}`))
  else errors.push(`${id}: tokens.json is missing`)
  for (const f of readdirSync(dir).filter((x) => LANG.test(x))) errors.push(...colourLeaks(readJson(join(dir, f)), f).map((l) => `${id}: a colour in the words — ${l}`))
}
for (const e of errors) console.log(`  ОШИБКА  ${e}`)
if (errors.length) { console.log(`===PROTOTYPES_FAILED=== ошибок: ${errors.length}`); process.exit(1) }
console.log(`===PROTOTYPES_OK=== прототипов: ${ids.length}`)
