// СТОРОЖ ИНСТРУКЦИИ ПО РЕЖИМАМ (шаг узла 552-5). Главная инструкция элемента — общая часть `CLAUDE.md` плюс файл режима сессии:
// `.claude/modes/build.md` (строительство); у нативного элемента рабочего процесса нет — `work.md` нет (шаг узла 552-7). Мост ядра кладёт файл режима в системную
// подсказку сессии (`--append-system-prompt-file`), поэтому раздел, попавший не в тот файл, до своей сессии не доходит, а раздел
// в двух файлах расходится молча.
//
// Владелец 2026-10-20 (план 552-5): «Подтвердить (Рекомендую)» — сторож проверяет, что каждый прежний раздел лежит ровно в одном
// месте. Проверяется: файлы есть · каждый известный раздел — ровно один раз и в своём файле · ни один заголовок `## ` не повторён в
// двух файлах · `CLAUDE.md` называет файл режима. Новый раздел, которого нет в списке, законен — повтор нет. Код 1 роняет сборку.
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PLACE = {
  'CLAUDE.md': ['Process —', 'Two natures', 'On wake', 'Skills by group', 'Outbound A2A guard', 'Protocols', 'How you report'],
  '.claude/modes/build.md': ['Confirm the request first', 'Plan the checks before the work', 'Steps', 'Skills of the build session',
    'Design skill', 'Page', 'Texts', 'Report what a person can see', 'Tree'],
}
const problems = []
const headings = {}
for (const f of Object.keys(PLACE)) {
  const p = join(ROOT, f)
  if (!existsSync(p)) { problems.push(`${f}: файла нет`); headings[f] = []; continue }
  headings[f] = readFileSync(p, 'utf8').replace(/\r\n/g, '\n').split('\n').filter((l) => l.startsWith('## ')).map((l) => l.slice(3).trim())
}
const all = Object.entries(headings).flatMap(([f, hs]) => hs.map((h) => [f, h]))
const starts = (h, s) => h.startsWith(s)
for (const [f, list] of Object.entries(PLACE)) {
  for (const s of list) {
    const found = all.filter(([, h]) => starts(h, s))
    if (found.length === 0) problems.push(`раздел «${s}» не найден нигде — его место ${f}`)
    else if (found.length > 1) problems.push(`раздел «${s}» встречается ${found.length} раза: ${found.map(([g]) => g).join(', ')}`)
    else if (found[0][0] !== f) problems.push(`раздел «${s}» лежит в ${found[0][0]}, а его место ${f}`)
  }
}
const seen = new Map()
for (const [f, h] of all) {
  if (seen.has(h)) problems.push(`заголовок «${h}» повторён: ${seen.get(h)} и ${f}`)
  else seen.set(h, f)
}
const claude = existsSync(join(ROOT, 'CLAUDE.md')) ? readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8') : ''
for (const f of ['.claude/modes/build.md']) if (!claude.includes(f)) problems.push(`CLAUDE.md не называет ${f}`)

if (problems.length) {
  console.error('===INSTRUCTION_MODES_FAIL=== инструкция по режимам разошлась (CLAUDE.md + .claude/modes/):')
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
const count = Object.values(PLACE).flat().length
console.log(`===INSTRUCTION_MODES_OK=== разделов на своих местах: ${count} (CLAUDE.md ${headings['CLAUDE.md'].length}, build ${headings['.claude/modes/build.md'].length})`)
