// СТОРОЖ ВИЗИТКИ A2A ЭЛЕМЕНТА — то, чего не проверяет сторож паспорта ядра (`npm run check:passport`: поля a2a.proto, двери ↔ навыки).
// Узел, шаг 433 (владелец 2026-10-07: «1 и 2 делай» — HTTP-двери остаются в skills с пометкой). Правила:
//   1. каждый id из `a2aSkills` расширения есть в `skills`;
//   2. навык вне `a2aSkills` — HTTP-дверь: тег `http-door`, описание с «Not over A2A», хотя бы одна дверь в `doors`;
//   3. навык из `a2aSkills` тега `http-door` не несёт;
//   4. у каждой связи `consumes` — протокол (`i2i` | `a2a`) и API `via` (`http` с путём, `mcp` с инструментом, `a2a-skill` с навыком)
//      и откуда адрес (`base`): по ним агент отвечает «с кем и как я связан», не читая код (шаг 548).
// Без этого чужой агент шлёт A2A-сообщение туда, где ждут HTTP, и наоборот. Навык — describe-element.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const EXT = 'https://fractera.ai/a2a/ext/node/v1'
const file = join(process.cwd(), 'OWN-SERVICE-PROPS', 'A2A-CARD.json')
const errors = []
let card
try { card = JSON.parse(readFileSync(file, 'utf8')) } catch (e) {
  console.log(`  ОШИБКА: OWN-SERVICE-PROPS/A2A-CARD.json не читается — ${e.message}`)
  console.log('\n===A2A_CARD_FAILED=== ошибок: 1')
  process.exit(1)
}
const skills = Array.isArray(card.skills) ? card.skills : []
const ext = (card.capabilities?.extensions ?? []).find((e) => e?.uri === EXT)?.params ?? {}
const a2a = new Set(Array.isArray(ext.a2aSkills) ? ext.a2aSkills : [])
const doors = Array.isArray(ext.doors) ? ext.doors : []
const ids = new Set(skills.map((s) => s?.id))

for (const id of a2a) if (!ids.has(id)) errors.push(`a2aSkills называет «${id}», а в skills его нет`)
for (const s of skills) {
  const tags = Array.isArray(s?.tags) ? s.tags : []
  if (a2a.has(s.id)) {
    if (tags.includes('http-door')) errors.push(`навык «${s.id}» идёт по A2A, а помечен http-door`)
    continue
  }
  if (!tags.includes('http-door')) errors.push(`навык «${s.id}» не идёт по A2A (нет в a2aSkills) — нужен тег http-door`)
  if (!/Not over A2A/.test(String(s?.description ?? ''))) errors.push(`навык «${s.id}»: описание не говорит «Not over A2A: an HTTP door — …»`)
  if (!doors.some((d) => d?.skill === s.id)) errors.push(`навык «${s.id}» помечен как HTTP-дверь, но в doors расширения его двери нет`)
}

const consumes = Array.isArray(ext.consumes) ? ext.consumes : []
for (const c of consumes) {
  const who = `consumes «${c?.from ?? '?'}/${c?.skill ?? '?'}»`
  if (!['i2i', 'a2a'].includes(c?.protocol)) errors.push(`${who}: protocol — i2i или a2a`)
  const v = c?.via
  if (!v || !['http', 'mcp', 'a2a-skill'].includes(v.kind)) { errors.push(`${who}: via.kind — http, mcp или a2a-skill`); continue }
  if (v.kind === 'http' && !v.path) errors.push(`${who}: via.path для http`)
  if (v.kind === 'mcp' && !v.tool) errors.push(`${who}: via.tool для mcp`)
  if (v.kind === 'a2a-skill' && !v.skill) errors.push(`${who}: via.skill для a2a-skill`)
  if (v.kind !== 'a2a-skill' && !v.base) errors.push(`${who}: via.base — откуда адрес`)
}

console.log(`связей: ${consumes.length} · навыков: ${skills.length} · по A2A: ${a2a.size} · HTTP-дверей: ${skills.length - [...ids].filter((i) => a2a.has(i)).length}`)
for (const e of errors) console.log(`  ОШИБКА: ${e}`)
if (errors.length) {
  console.log(`\n===A2A_CARD_FAILED=== ошибок: ${errors.length}`)
  process.exit(1)
}
console.log('\n===A2A_CARD_OK=== ошибок нет')
