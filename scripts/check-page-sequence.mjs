#!/usr/bin/env node
// check:page-sequence — сторож ПОСЛЕДОВАТЕЛЬНОСТИ СТРАНИЦЫ (узел, шаг 423).
//
// 🔒 ЗАКОН (владелец 2026-10-07): страница — последовательность трёх видов в любом порядке: `section-*` (оформленная секция —
// папка `components/sections/<вид>/`), `text-*` (типографика элемента), `widget-*` (виджет своей ветки). Инструмент `tool-*` на страницу не
// попадает никогда — только изнутри виджета.
//
// Что проверяется, по каждой папке данных страницы (`_data/`, `_pages/**/`):
//   1. каждый `kind` — одного из трёх видов; `tool-*` и чужое — отказ;
//   2. у всех языков, где есть `body`, та же последовательность видов, что у `en.json`: перевод не уронит виджет и не
//      переставит части (перевод заменяет массив целиком — `lib/page-tree.ts`, `wordsIn`);
//   3. секция есть в наборе элемента (`components/sections/index.ts`), типографика — в `lib/content/text-set.tsx`, виджет —
//      в `_widgets/index.tsx` СВОЕЙ ветки (удалили ветку — её виджеты ушли вместе с ней).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const LANG = join(ROOT, 'app', '[lang]')
const read = (p) => readFileSync(p, 'utf8')
const keysOf = (file, prefix) => new Set([...read(join(ROOT, file)).matchAll(new RegExp(`'(${prefix}[a-z0-9-]+)'\\s*:`, 'g'))].map((m) => m[1]))
const SECTIONS = keysOf('components/sections/index.ts', 'section-')
const TEXTS = keysOf('lib/content/text-set.tsx', 'text-')
// `section-faq` рисует фабрика страницы из поля `faq`, его в данных нет — но если он там стоит, он законен.
const OLD_KEY = 'blocks' // the key of a page's list before node step 717-2
const problems = []
const fail = (file, msg) => problems.push(`  ${relative(ROOT, file).split(sep).join('/')}: ${msg}`)

/** Папка ветки — та, где лежит `_widgets/` (корень ветки). */
function branchOf(dir) {
  let d = dir
  while (d.startsWith(LANG)) {
    if (existsSync(join(d, '_widgets'))) return d
    d = join(d, '..')
  }
  return null
}
const widgetCache = new Map()
function widgetsOf(branch) {
  if (!widgetCache.has(branch)) {
    const f = join(branch, '_widgets', 'index.tsx')
    widgetCache.set(branch, existsSync(f) ? new Set([...read(f).matchAll(/'(widget-(?:static|dynamic)-[a-z0-9-]+)'\s*:/g)].map((m) => m[1])) : new Set())
  }
  return widgetCache.get(branch)
}

function pageDirs(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (!statSync(p).isDirectory()) continue
    if (name === 'node_modules' || name === '_widgets' || name === '_components' || name === '_libs') continue
    if (existsSync(join(p, 'en.json'))) out.push(p)
    pageDirs(p, out)
  }
  return out
}

let pages = 0
for (const dir of pageDirs(LANG)) {
  const en = JSON.parse(read(join(dir, 'en.json')))
  // 717-2: the page's list was renamed; a page still on the old key would be skipped here and drawn empty — say it
  if (Array.isArray(en[OLD_KEY])) { fail(join(dir, 'en.json'), `старый ключ «${OLD_KEY}» — тело страницы теперь «body» (npm run migrate:sections -- --apply)`); continue }
  if (!Array.isArray(en.body)) continue
  pages++
  const branch = branchOf(dir)
  const seq = en.body.map((b) => b.kind)
  for (const kind of seq) {
    if (typeof kind !== 'string') { fail(join(dir, 'en.json'), 'элемент без kind'); continue }
    if (kind.startsWith('tool-')) fail(join(dir, 'en.json'), `«${kind}» — инструмент на страницу не попадает, только изнутри виджета`)
    else if (kind.startsWith('section-')) { if (!SECTIONS.has(kind) && kind !== 'section-faq') fail(join(dir, 'en.json'), `секции «${kind}» нет в наборе элемента — своя папка components/sections/${kind}/ и строка в components/sections/index.ts`) }
    else if (kind.startsWith('text-')) { if (!TEXTS.has(kind)) fail(join(dir, 'en.json'), `типографики «${kind}» нет в lib/content/text-set.tsx`) }
    else if (kind.startsWith('widget-')) { if (!branch || !widgetsOf(branch).has(kind)) fail(join(dir, 'en.json'), `виджета «${kind}» нет в _widgets/index.tsx своей ветки`) }
    else fail(join(dir, 'en.json'), `«${kind}» — не секция, не типографика и не виджет (section-* · text-* · widget-*)`)
  }
  for (const f of readdirSync(dir).filter((x) => /^[a-z]{2}\.json$/.test(x) && x !== 'en.json')) {
    const w = JSON.parse(read(join(dir, f)))
    if (!Array.isArray(w.body)) continue
    const other = w.body.map((b) => b.kind)
    if (other.join('|') !== seq.join('|')) fail(join(dir, f), `последовательность видов не совпадает с en.json — en: [${seq.join(', ')}] · ${f.slice(0, 2)}: [${other.join(', ')}]`)
  }
}

if (problems.length) {
  console.error(`===PAGE_SEQUENCE_FAILED=== нарушений: ${problems.length}\n${problems.join('\n')}`)
  console.error('Страница — последовательность section-* · text-* · widget-*; во всех языках одна и та же. `.claude/modes/build.md`, «Page».')
  process.exit(1)
}
console.log(`===PAGE_SEQUENCE_OK=== страниц: ${pages}; секций в наборе: ${SECTIONS.size}, типографики: ${TEXTS.size}`)
