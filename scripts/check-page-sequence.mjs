#!/usr/bin/env node
// check:page-sequence — сторож ПОСЛЕДОВАТЕЛЬНОСТИ СТРАНИЦЫ (узел, шаг 423).
//
// 🔒 ЗАКОН (владелец 2026-10-07): страница — последовательность трёх видов в любом порядке: `block-*` (оформленная секция из
// реестра «Блоков»), `text-*` (типографика элемента), `widget-*` (виджет своей ветки). Инструмент `tool-*` на страницу не
// попадает никогда — только изнутри виджета.
//
// Что проверяется, по каждой папке данных страницы (`_data/`, `_pages/**/`):
//   1. каждый `kind` — одного из трёх видов; `tool-*` и чужое — отказ;
//   2. у всех языков, где есть `blocks`, та же последовательность видов, что у `en.json`: перевод не уронит виджет и не
//      переставит блоки (перевод заменяет массив целиком — `lib/page-tree.ts`, `wordsIn`);
//   3. блок есть в наборе элемента (`lib/content/blocks/registry.tsx`), типографика — в `lib/content/text-set.tsx`, виджет —
//      в `_widgets/index.tsx` СВОЕЙ ветки (удалили ветку — её виджеты ушли вместе с ней).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const LANG = join(ROOT, 'app', '[lang]')
const read = (p) => readFileSync(p, 'utf8')
const keysOf = (file, prefix) => new Set([...read(join(ROOT, file)).matchAll(new RegExp(`'(${prefix}[a-z0-9-]+)'\\s*:`, 'g'))].map((m) => m[1]))
const BLOCKS = keysOf('lib/content/blocks/registry.tsx', 'block-')
const TEXTS = keysOf('lib/content/text-set.tsx', 'text-')
// `block-faq` рисует фабрика страницы из поля `faq`, его в данных нет — но если он там стоит, он законен.
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
  if (!Array.isArray(en.blocks)) continue
  pages++
  const branch = branchOf(dir)
  const seq = en.blocks.map((b) => b.kind)
  for (const kind of seq) {
    if (typeof kind !== 'string') { fail(join(dir, 'en.json'), 'элемент без kind'); continue }
    if (kind.startsWith('tool-')) fail(join(dir, 'en.json'), `«${kind}» — инструмент на страницу не попадает, только изнутри виджета`)
    else if (kind.startsWith('block-')) { if (!BLOCKS.has(kind) && kind !== 'block-faq') fail(join(dir, 'en.json'), `блока «${kind}» нет в наборе элемента — npx shadcn add @fractera/${kind} и строка в lib/content/blocks/registry.tsx`) }
    else if (kind.startsWith('text-')) { if (!TEXTS.has(kind)) fail(join(dir, 'en.json'), `типографики «${kind}» нет в lib/content/text-set.tsx`) }
    else if (kind.startsWith('widget-')) { if (!branch || !widgetsOf(branch).has(kind)) fail(join(dir, 'en.json'), `виджета «${kind}» нет в _widgets/index.tsx своей ветки`) }
    else fail(join(dir, 'en.json'), `«${kind}» — не блок, не типографика и не виджет (block-* · text-* · widget-*)`)
  }
  for (const f of readdirSync(dir).filter((x) => /^[a-z]{2}\.json$/.test(x) && x !== 'en.json')) {
    const w = JSON.parse(read(join(dir, f)))
    if (!Array.isArray(w.blocks)) continue
    const other = w.blocks.map((b) => b.kind)
    if (other.join('|') !== seq.join('|')) fail(join(dir, f), `последовательность видов не совпадает с en.json — en: [${seq.join(', ')}] · ${f.slice(0, 2)}: [${other.join(', ')}]`)
  }
}

if (problems.length) {
  console.error(`===PAGE_SEQUENCE_FAILED=== нарушений: ${problems.length}\n${problems.join('\n')}`)
  console.error('Страница — последовательность block-* · text-* · widget-*; во всех языках одна и та же. `.claude/modes/build.md`, «Page».')
  process.exit(1)
}
console.log(`===PAGE_SEQUENCE_OK=== страниц: ${pages}; блоков в наборе: ${BLOCKS.size}, типографики: ${TEXTS.size}`)
