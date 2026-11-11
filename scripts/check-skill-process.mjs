// СТОРОЖ ПРОЦЕССА И ГРУПП НАВЫКОВ (шаги узла 465-4, 552-2, 552-3). У каждого навыка назван процесс, каждый свой навык лежит в
// одной группе своего режима, и каждый навык, названный в тексте, существует.
//
// Владелец 2026-10-12: «перепроверить все созданные навыки и вписать к какому типу процесса они относятся принудительно чтобы
// подобных пропусков не было»; «если агент создает навык он обязан определить относится этот навык к рабочему процессу или к
// строительным процессу». ✗ Оплачено: напоминание (рабочий процесс, данные) было построено как код — коммит, push, пересборка.
// Владелец 2026-10-20 (552): навыки — по группам `build-skills · workspace-skills · messenger-skills · own-service-props-skills`.
//
// Группа — плагин Claude Code: `.claude/skills/<группа>/.claude-plugin/plugin.json` и навыки в `<группа>/skills/<навык>/`.
// Навык прямо в корне группы Claude Code не загружает (проба 552-1), свой навык в корне `.claude/skills/` — вне режимов.
// Чужой навык (рядом `SOURCE.md`) остаётся в корне и свой текст не меняет: его процесс — строка `Process: build|working|both`.
// Свой навык: `description` начинается с `Builder skill` · `Work skill` · `Both natures`, а в теле — строка `**Process: build**` ·
// `**Process: working**` · `**Process: both**`, и они согласны. Имя навыка без группы одно на весь элемент: Claude Code находит
// навык по окончанию имени, и два одинаковых окончания заставят агента писать полное имя.
// Правило для агента — `CLAUDE.md`, раздел «Skills by group». Нарушение роняет сборку (код 1).
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, '.claude', 'skills')
const KIND = { 'Builder skill': 'build', 'Work skill': 'working', 'Both natures': 'both' }
const GROUPS = ['build-skills', 'workspace-skills', 'messenger-skills', 'own-service-props-skills']

const problems = []
// 717-4: Claude Code gives the skill list 1 % of the window at 4 characters a token — 40,000 characters at 1M, 8,000 at 200k (2.1.322,
// read from its binary); over it the descriptions collapse to bare names and a skill stops waking. Measured at 069311a: the main pass
// 39,963, the design pass 42,111. The ceiling here keeps 40 % of the 1M budget free; one description at most DESC_MAX characters.
const DESC_MAX = 440
const PASS_MAX = 24000
const DESCS = []
const descOf = (fm) => {
  const lines = fm.split('\n'); const i = lines.findIndex((l) => /^description:/.test(l)); if (i < 0) return ''
  let j = i + 1; while (j < lines.length && /^\s/.test(lines[j])) j++
  return [lines[i].replace(/^description:\s*([>|]-?)?\s*/, ''), ...lines.slice(i + 1, j)].map((l) => l.trim()).filter(Boolean).join(' ').replace(/^["']|["']$/g, '')
}
const seen = new Map()
let count = 0
// Таблица групп — вторая половина знания: навык без строки в таблице агент не найдёт по режиму. С 552-5 строки живут там, где
// их читает сессия: общие группы — в CLAUDE.md («Skills by group»), группа режима — в его файле `.claude/modes/<режим>.md`.
const TABLE_FILES = ['CLAUDE.md', '.claude/modes/build.md', '.claude/modes/work.md']
const tableIn = (f) => {
  const text = existsSync(join(ROOT, f)) ? readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n') : ''
  const at = text.indexOf('| Group | Mode | Skills |')
  if (at < 0) return ''
  const end = text.indexOf('\n\n', at)
  return text.slice(at, end < 0 ? undefined : end)
}
const table = TABLE_FILES.map(tableIn).join('\n')
const rowOf = (group) => table.split('\n').find((l) => l.startsWith(`| ${group} `)) ?? ''
const inRow = (group, name) => rowOf(group).includes('`' + name + '`')
const dirs = (p) => (existsSync(p) ? readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory()) : [])
const note = (name, where) => { if (seen.has(name)) problems.push(`${name}: то же имя уже в ${seen.get(name)}`); seen.set(name, where) }

function own(dir, name, group) {
  count++
  note(name, group)
  const file = join(dir, 'SKILL.md')
  if (!existsSync(file)) { problems.push(`${group}/${name}: нет SKILL.md`); return }
  const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const desc = text.match(/^description:\s*>?-?\s*\n?\s*(.*)$/m)?.[1] ?? ''
  const lead = Object.keys(KIND).find((k) => desc.startsWith(k))
  const body = text.match(/^\*\*Process: (build|working|both)\*\*/m)?.[1]
  if (!lead) problems.push(`${name}: description не начинается с «Builder skill» / «Work skill» / «Both natures»`)
  if (!body) problems.push(`${name}: в теле нет строки «**Process: build|working|both**»`)
  if (lead && body && KIND[lead] !== body) problems.push(`${name}: description говорит «${lead}», а тело — «Process: ${body}»`)
  if (!inRow(group, name)) problems.push(`${name}: нет в строке «${group}» таблицы групп (CLAUDE.md или .claude/modes/<режим>.md)`)
  // 717-4: the head must parse and the description must be short. A plain one-line description with «: » inside is not YAML, and
  // three skills carried that (take-card-payment, ultracode-session, order-summary); a folded scalar (`description: >`) cannot break.
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? ''
  if (!new RegExp(`^name: ${name}$`, 'm').test(fm)) problems.push(`${name}: в заголовке нет «name: ${name}» — имя навыка равно его папке`)
  if (!/^description: [>|]-?\n(  .*\n?)+/m.test(fm + '\n')) problems.push(`${name}: description не сложенной строкой «description: >» с отступом в два пробела — однострочное с «: » внутри ломает YAML`)
  const d = descOf(fm)
  DESCS.push({ group, name, len: name.length + d.length + 4 })
  if (d.length > DESC_MAX) problems.push(`${name}: description ${d.length} знаков, предел ${DESC_MAX} — подробности в тело навыка (717-4)`)
}

for (const name of dirs(DIR)) {
  const dir = join(DIR, name)
  const manifest = join(dir, '.claude-plugin', 'plugin.json')
  if (existsSync(manifest)) {
    if (!GROUPS.includes(name)) { problems.push(`${name}: группа не из списка (${GROUPS.join(', ')})`); continue }
    let m = {}
    try { m = JSON.parse(readFileSync(manifest, 'utf8')) } catch { problems.push(`${name}: plugin.json не читается`) }
    if (m.name !== name) problems.push(`${name}: в plugin.json name «${m.name}» — Claude Code назовёт навыки по нему, а не по папке`)
    if (typeof m.defaultEnabled !== 'boolean') problems.push(`${name}: в plugin.json нет defaultEnabled`)
    for (const stray of dirs(dir).filter((n) => n !== 'skills' && n !== '.claude-plugin')) {
      problems.push(`${name}/${stray}: навык в корне группы Claude Code не загрузит — место ему в ${name}/skills/`)
    }
    for (const skill of dirs(join(dir, 'skills'))) own(join(dir, 'skills', skill), skill, name)
    continue
  }
  if (existsSync(join(dir, 'SOURCE.md'))) {
    count++
    note(name, 'корне')
    const source = readFileSync(join(dir, 'SOURCE.md'), 'utf8')
    if (!/^Process: (build|working|both)\b/m.test(source)) problems.push(`${name}: чужой навык без строки «Process: build|working|both» в SOURCE.md`)
    // 590-5: в каком проходе строительства мост включает чужой навык — строка `Pass: main|design|texts` (один или несколько, до тире).
    const pass = /^Pass:\s*(.+)$/m.exec(source)?.[1]?.split(' — ')[0].split(/[\s,;]+/).filter(Boolean) ?? []
    if (!pass.length || pass.some((p) => !['main', 'design', 'texts', 'study'].includes(p))) problems.push(`${name}: чужой навык без строки «Pass: main|design|texts|study» в SOURCE.md — узел не знает, в каком проходе его включать`)
    const vfm = (existsSync(join(dir, 'SKILL.md')) ? readFileSync(join(dir, 'SKILL.md'), 'utf8').replace(/\r\n/g, '\n') : '').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
    DESCS.push({ group: 'vendored', name, passes: pass, len: name.length + Math.min(descOf(vfm).length, 1536) + 4 })
    if (!inRow('vendored', name)) problems.push(`${name}: нет в строке «vendored» таблицы групп (CLAUDE.md или .claude/modes/<режим>.md)`)
    continue
  }
  problems.push(`${name}: свой навык в корне .claude/skills — его место в группе своего режима (${GROUPS.join(', ')})`)
}

// Путь к навыку в тексте или программе ведёт к существующей папке (552-2): после переезда навыков в группы старый путь
// `.claude/skills/<навык>` молча ведёт в никуда, и агент, идущий по нему, ничего не находит. Пути со вставками (`<группа>`)
// обрываются на `<` и проверяются до него; путь домашней папки человека (`~/.claude/skills`) — не наш.
const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n')
  .filter((f) => /\.(md|mjs|cjs|js|ts|tsx|json)$/.test(f) && !f.endsWith('tree-manifest.json'))
for (const f of tracked) {
  let text = ''
  try { text = readFileSync(join(ROOT, f), 'utf8') } catch { continue }
  for (const m of text.matchAll(/(~\/|[\w.-]\/)?\.claude\/skills\/[A-Za-z0-9._/-]*/g)) {
    if (m[1]) continue
    const path = m[0].replace(/[./-]+$/, '')
    if (!existsSync(join(ROOT, path))) problems.push(`${f}: путь «${path}» ведёт в никуда — навыки своих групп лежат в .claude/skills/<группа>/skills/`)
  }
}

// Навык, названный в тексте, существует (552-3): снятый навык живёт в чужих строках — «of skill `<имя>`», «(skill <имя>)», строка
// таблицы, — и агент, идущий по ним, получает «Unknown skill». Ловятся: имя с дефисом рядом со словом skill (без дефиса это поле
// или слово: «skill `id`», «skill groups»), первая колонка таблицы `.claude/skills/README.md`, имена в таблице «Skills by group»
// и команды `/<группа>:<навык>` (навык обязан лежать в этой группе). Голое имя в штрихах без слова skill не проверяется: его не
// отличить от слова кода. Смотрятся тексты, которые читает агент: CLAUDE.md, .claude/, scripts/, development-docs/README.md.
// Навыки главного агента ядра (`lib/main-agent/skills/` ядра) — чужие, но настоящие: текст, адресованный ядру, их называет.
const CORE_SKILLS = ['answer-element', 'ask-element', 'create-element', 'route-to-element', 'supervise-element']
const reads = (f) => f === 'CLAUDE.md' || f.startsWith('.claude/') || f.startsWith('scripts/') || f === 'development-docs/README.md'
// 706-4: текст ПРИВЕЗЁННОГО навыка (папка с `SOURCE.md` в корне `.claude/skills/`) не правится руками и называет навыки своего мира
// (у deslop — поле `allowed-tools`); он не проверяется на имена этого элемента.
const vendoredText = (f) => { const p = f.split('/'); return p[0] === '.claude' && p[1] === 'skills' && p.length > 3 && existsSync(join(ROOT, '.claude', 'skills', p[2], 'SOURCE.md')) }
const named = (f, name, how) => { if (!seen.has(name) && !CORE_SKILLS.includes(name)) problems.push(`${f}: ${how} называет навык «${name}», которого нет`) }
const KEBAB = '([a-z0-9]+(?:-[a-z0-9]+)+)'
for (const f of tracked.filter((x) => reads(x) && !vendoredText(x))) {
  let text = ''
  try { text = readFileSync(join(ROOT, f), 'utf8') } catch { continue }
  for (const m of text.matchAll(new RegExp(String.raw`\b[Ss]kills?\s+` + '`?' + KEBAB + String.raw`\b`, 'g'))) named(f, m[1], 'текст')
  for (const m of text.matchAll(new RegExp('`' + KEBAB + '`' + String.raw`\s+skill\b`, 'g'))) named(f, m[1], 'текст')
  for (const m of text.matchAll(/\/(build-skills|workspace-skills|messenger-skills|own-service-props-skills):([a-z0-9-]+)/g)) {
    if (seen.get(m[2]) !== m[1]) problems.push(`${f}: команда «/${m[1]}:${m[2]}» ведёт в никуда — в группе ${m[1]} такого навыка нет`)
  }
  if (f === '.claude/skills/README.md') for (const m of text.matchAll(/^\| `([^`]+)` \|/gm)) named(f, m[1], 'строка таблицы')
}
for (const row of table.split('\n').filter((l) => l.startsWith('| '))) {
  for (const m of row.matchAll(/`([a-z0-9][a-z0-9-]*)`/g)) named('CLAUDE.md', m[1], 'таблица «Skills by group»')
}

// 717-4: the list a build session sees — the groups whose row says `build` plus the vendored skills of that pass.
const buildGroups = table.split('\n').filter((l) => /^\| [a-z-]+ \| [^|]*\b(build|every mode)\b/.test(l) && !l.startsWith('| vendored ')).map((l) => l.split('|')[1].trim())
const listSize = {}
for (const p of ['main', 'design', 'texts', 'study']) {
  listSize[p] = DESCS.filter((s) => (s.group === 'vendored' ? s.passes?.includes(p) : buildGroups.includes(s.group))).reduce((a, s) => a + s.len, 0)
  if (listSize[p] > PASS_MAX) problems.push(`проход ${p}: список навыков ${listSize[p]} знаков, предел ${PASS_MAX} (40 000 при окне 1M, 8 000 при 200k) — сократите описания`)
}

if (problems.length) {
  console.error(`===SKILL_PROCESS_FAIL=== навык без процесса или вне своей группы (CLAUDE.md, «Skills by group»):`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log(`===SKILL_PROCESS_OK=== процесс и группа названы у всех навыков: ${count}; названные в текстах навыки существуют; список строительства: ${Object.entries(listSize).map(([p, n]) => `${p} ${n}`).join(', ')} из ${PASS_MAX}`)
