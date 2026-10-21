// АДРЕСА ПОДСВЕТКИ В КОДЕ ВИДЖЕТОВ (node step 335). Подсветка в Preview рамкой обводит элемент с `data-block`. Страницы из
// данных получают адрес от фабрики `page-body` (`bid` в `<язык>.json`, сторож `check-block-ids.mjs`). Виджет — код, который
// агент сгенерировал сам (лендинг `widgetOnly`, таблица, форма), — фабрику обходит, и без этой процедуры в нём ноль адресов:
// «включил подсветку и ничего не увидел» (владелец 2026-09-28).
//
// 🔒 ПРОЦЕДУРА ПОСЛЕ ГЕНЕРАЦИИ: написал или переписал виджет → `npm run widgets:ids`. Скрипт читает TSX каждого виджета,
// в `app/**/_widgets/{static|dynamic}/<виджет>/`, компилятором TypeScript и ставит
// `data-block="<буква + 4 base36>"` на каждый элемент-контейнер (CONTAINERS ниже), у которого адреса нет. Стоящие адреса не
// трогает — повторный прогон ничего не меняет, и адрес, однажды скопированный архитектором, не уезжает.
// Без `--fix` — сторож в `prebuild`: контейнер без адреса валит сборку с командой лечения.
//
// Адрес из «Скопировать адрес» ищется в коде: `git grep 'data-block="k3f9a"' components/`. Элемент внутри `.map()` несёт один
// адрес на все повторы — это адрес места в коде, а не экземпляра.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import ts from 'typescript'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const FIX = process.argv.includes('--fix')
const CONTAINERS = new Set([
  'section', 'header', 'footer', 'main', 'article', 'aside', 'nav', 'div', 'ol', 'ul', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'figure', 'blockquote', 'form', 'table',
  // 425 (владелец 2026-10-07: только shadcn): контейнеры-компоненты `components/ui` и типографики — каждый передаёт свойства
  // на свой DOM-элемент (`...props`), поэтому `data-block` доходит до страницы. Новый контейнерный компонент — строка здесь.
  'Card', 'CardHeader', 'CardContent', 'CardFooter', 'Accordion', 'AccordionItem', 'Alert', 'FieldSet', 'FieldGroup', 'Field',
  'Collapsible', 'CollapsibleContent', 'ScrollArea', 'EmptyState', 'ButtonGroup', 'Table', 'Tabs', 'TabsContent',
  'H1', 'H2', 'H3', 'H4', 'P', 'Lead',
])
const rel = (p) => relative(ROOT, p).split(sep).join('/')

function files(dir, ext, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) files(p, ext, out)
    else if (name.endsWith(ext)) out.push(p)
  }
  return out
}

// 425 (владелец 2026-10-07: «элементы без идентификаторов не должны пропускаться сторожем»). Под процедурой всё, что рисуется
// кодом, а не данными: каждый виджет (`<ветка>/_widgets/{static|dynamic}/<widget-…>/`), каждый инструмент (`_tools/tool-*/`) и
// каждый файл `components/`, до которого они дотягиваются импортом (общие части элемента внутри виджета). Сам shadcn
// (`components/ui`), вендорные элементы ИИ (`components/ai-elements`) и окно `AppDialog` (`components/dialog`) — библиотека,
// не под процедурой: адрес ставит тот, кто их зовёт.
const dirs = []
const findWidgets = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (!statSync(p).isDirectory()) continue
    if (name === '_widgets') {
      for (const kind of ['static', 'dynamic']) {
        const k = join(p, kind)
        if (existsSync(k)) for (const w of readdirSync(k)) if (statSync(join(k, w)).isDirectory()) dirs.push(join(k, w))
      }
    } else findWidgets(p)
  }
}
findWidgets(join(ROOT, 'app'))
const TOOLS = join(ROOT, '_tools')
if (existsSync(TOOLS)) for (const t of readdirSync(TOOLS)) if (t.startsWith('tool-') && statSync(join(TOOLS, t)).isDirectory()) dirs.push(join(TOOLS, t))

const LIBRARY = ['ui', 'ai-elements', 'dialog'].map((d) => join(ROOT, 'components', d) + sep)
const isLibrary = (p) => LIBRARY.some((l) => p.startsWith(l))
const extraFiles = new Set()
function resolveImport(from, spec) {
  let base = null
  if (spec.startsWith('@/components/')) base = join(ROOT, spec.slice(2))
  else if (spec.startsWith('.') && from.startsWith(join(ROOT, 'components') + sep)) base = join(dirname(from), spec)
  if (!base) return null
  for (const c of [base + '.tsx', base + '.ts', join(base, 'index.tsx'), join(base, 'index.ts')]) if (existsSync(c) && statSync(c).isFile()) return c
  return null
}
function follow(file, seen = new Set()) {
  if (seen.has(file)) return
  seen.add(file)
  for (const m of readFileSync(file, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const r = resolveImport(file, m[1])
    if (!r || isLibrary(r) || !r.startsWith(join(ROOT, 'components') + sep)) continue
    if (r.endsWith('.tsx')) extraFiles.add(r)
    follow(r, seen)
  }
}
for (const d of dirs) for (const f of files(d, '.tsx')) follow(f)


// Занятые адреса — во всём DOM сайта: `bid` данных и уже стоящие в коде.
const taken = new Set()
for (const f of files(join(ROOT, 'app'), '.json')) for (const m of readFileSync(f, 'utf8').matchAll(/"bid":\s*"([a-z0-9]+)"/g)) taken.add(m[1])
for (const root of ['components', 'app', '_tools'].filter((r) => existsSync(join(ROOT, r)))) for (const f of files(join(ROOT, root), '.tsx')) for (const m of readFileSync(f, 'utf8').matchAll(/data-block="([a-z0-9]+)"/g)) taken.add(m[1])

function newId() {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (;;) {
    const b = randomBytes(5)
    let id = a[b[0] % 26]
    for (let i = 1; i < 5; i++) id += a[b[i] % 36]
    if (!taken.has(id)) { taken.add(id); return id }
  }
}

const missing = []
let stamped = 0
const targets = [...new Set([...dirs.flatMap((d) => files(d, '.tsx')), ...extraFiles])]
{
  for (const file of targets) {
    const text = readFileSync(file, 'utf8')
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const spots = []
    const visit = (node) => {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName) && CONTAINERS.has(node.tagName.text)) {
        const has = node.attributes.properties.some((a) => ts.isJsxAttribute(a) && a.name.getText(sf) === 'data-block')
        if (!has) {
          const { line } = sf.getLineAndCharacterOfPosition(node.tagName.getStart(sf))
          spots.push({ at: node.tagName.end, where: `${rel(file)}:${line + 1} <${node.tagName.text}>` })
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
    if (!spots.length) continue
    if (!FIX) { missing.push(...spots.map((s) => s.where)); continue }
    let out = text
    for (const s of spots.sort((a, b) => b.at - a.at)) out = `${out.slice(0, s.at)} data-block="${newId()}"${out.slice(s.at)}`
    writeFileSync(file, out)
    stamped += spots.length
    console.log(`  ${rel(file)}: +${spots.length}`)
  }
}

if (missing.length) {
  for (const m of missing) console.error(`  ${m}`)
  console.error(`===WIDGET_IDS_FAILED=== контейнеров без адреса подсветки: ${missing.length}. Поставить: npm run widgets:ids`)
  process.exit(1)
}
console.log(`===WIDGET_IDS_OK===${stamped ? ` поставлено адресов: ${stamped}` : ''} у каждого контейнера виджетов и инструментов (${dirs.length} папок, ${extraFiles.size} общих файлов) есть data-block`)
