import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { BLOCK_SET } from '@/lib/content/blocks/registry'

// БЛОКИ ЭТОГО ЭЛЕМЕНТА ПО РАЗДЕЛАМ — данные таблицы `admin/blocks`, страниц разделов и Preview (шаг узла 577-11). Владелец 2026-10-23:
// «чтобы можно было перейти и увидеть какие блоки уже существуют в этом элементе … единая логика»; «структуру можно воссоздать сразу даже
// если она внутри останется пустой разместишь там просто один файл readme.md, например:/<язык>/admin/blocks/hero/readme.md»; выбор «Код там
// же, разделы — адреса».
// 🔒 ИСТОЧНИКИ — ФАЙЛЫ САМОГО ЭЛЕМЕНТА, второго списка нет:
//   разделы — папки `_pages/blocks/<раздел>/README.md` (имя папки — адрес; «# <id> — <Title>», русское название в «…», «Order: N.»);
//   блоки — строки `BLOCK_SET` в ИСХОДНИКЕ `lib/content/blocks/registry.tsx`, прочитанном с диска при отрисовке; код — `components/blocks/`;
//   раздел и описание блока — его карточка `components/blocks/<блок>.card.json` (`categories`, `use`; приходит с `npm run blocks -- add`),
//   без карточки — строка `components/blocks/README.md` и раздел «unsorted»;
//   откуда — замок `components/blocks/.blocks-lock.json`, иначе шаблон; где стоит — данные страниц (`app/[lang]/**/_pages/**`, `_data`).
// Каталог «Блоков» здесь не спрашивается: страница работает и там, где «Блоков» нет.
// 🔒 БЕЗ РАЗВЁРТЫВАНИЯ (владелец 2026-10-23: «он должен появляться автоматически без нового развёртывания … Это критически важно»): список
// читается с диска, а не из собранного набора, — блок, поставленный командой, виден в таблице с ближайшей перерисовкой страницы (≤ 5 мин).
// Нарисовать его может только сборка (это код): до неё строка говорит «ждёт сборки» (`built: false`) и Preview не открывается.

const ROOT = () => process.env.ELEMENT_DIR || process.cwd()
const BLOCKS_DIR = () => join(ROOT(), 'components', 'blocks')
const APP_LANG = () => join(ROOT(), 'app', '[lang]')
const SECTIONS_DIR = () => join(APP_LANG(), '(protectedLayer)', 'admin', '_pages', 'blocks')
export const UNSORTED = 'unsorted'

type Node = { kind?: string; children?: unknown; [k: string]: unknown }
type Card = { use?: string; categories?: string[]; cases?: { props?: Record<string, unknown> }[] }
export type BlockSection = { id: string; order: number; title: Record<string, string>; purpose: string }
export type ElementBlockRow = {
  name: string
  section: string
  sectionTitle: string
  description: string
  origin: { from: 'catalogue'; version: string } | { from: 'template' }
  pages: string[]
  previewable: boolean
  /** Блок есть в работающей сборке; нет — он поставлен после неё и ждёт сборки. */
  built: boolean
  href: string
}

const readJson = <T>(f: string): T | null => { try { return JSON.parse(readFileSync(f, 'utf8')) as T } catch { return null } }
const card = (name: string) => readJson<Card>(join(BLOCKS_DIR(), `${name}.card.json`))
const lock = () => readJson<Record<string, { version?: string }>>(join(BLOCKS_DIR(), '.blocks-lock.json')) ?? {}

/** Разделы — папки с README.md; порядок — «Order: N.», затем имя. */
export function blockSections(): BlockSection[] {
  const dir = SECTIONS_DIR()
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((n) => statSync(join(dir, n)).isDirectory() && existsSync(join(dir, n, 'README.md')))
    .map((id) => {
      const text = readFileSync(join(dir, id, 'README.md'), 'utf8')
      const en = /^#\s+\S+\s+—\s+(.+)$/m.exec(text)?.[1]?.trim() ?? id
      const ru = /«([^»]+)»/.exec(text)?.[1] ?? en
      const order = Number(/Order:\s*(\d+)/.exec(text)?.[1] ?? 999)
      const purpose = text.split(/\r?\n\r?\n/).map((p) => p.trim()).find((p) => p && !p.startsWith('#') && !p.startsWith('Russian title')) ?? ''
      return { id, order, title: { en, ru }, purpose }
    })
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
}

/** Раздел блока — первая категория его карточки, если такая папка есть; иначе «unsorted». */
export function sectionOf(name: string, sections = blockSections()): string {
  const c = card(name)?.categories?.find((x) => sections.some((s) => s.id === x))
  return c ?? UNSORTED
}

function readmeLine(name: string): string {
  const f = join(BLOCKS_DIR(), 'README.md')
  if (!existsSync(f)) return ''
  const row = readFileSync(f, 'utf8').split(/\r?\n/).find((l) => l.startsWith('|') && l.includes(`\`${name}.tsx\``))
  return row ? (row.split('|')[2] ?? '').trim() : ''
}

/** Файлы данных страниц для языка: `<lang>.json` папки, иначе её `en.json`; путь — адрес страницы без групп. */
function pageFiles(lang: string): { file: string; path: string }[] {
  const out: { file: string; path: string }[] = []
  const walk = (dir: string) => {
    if (!existsSync(dir)) return
    const names = readdirSync(dir)
    const own = names.includes(`${lang}.json`) ? `${lang}.json` : names.includes('en.json') ? 'en.json' : null
    const parts = dir.split(sep)
    if (own && (parts[parts.length - 1] === '_data' || parts.includes('_pages'))) {
      const segs = relative(APP_LANG(), dir).split(sep).filter((s) => s && !s.startsWith('(') && s !== '_pages' && s !== '_data')
      out.push({ file: join(dir, own), path: `/${segs.join('/')}` })
    }
    for (const n of names) {
      if (n === 'node_modules' || n.startsWith('.')) continue
      const p = join(dir, n)
      if (statSync(p).isDirectory()) walk(p)
    }
  }
  walk(APP_LANG())
  return out
}

function nodesOf(file: string): Node[] {
  const all: Node[] = []
  const visit = (n: Node) => {
    all.push(n)
    if (Array.isArray(n.children)) for (const c of n.children as Node[]) if (c && typeof c === 'object') visit(c)
  }
  for (const b of readJson<{ blocks?: Node[] }>(file)?.blocks ?? []) visit(b)
  return all
}

/** Блоки, которые страница вправе назвать, — ключи `BLOCK_SET` в исходнике `registry.tsx` (с диска, не из сборки). */
export function registeredBlocks(): string[] {
  try {
    const src = readFileSync(join(ROOT(), 'lib', 'content', 'blocks', 'registry.tsx'), 'utf8')
    const set = /BLOCK_SET[^=]*=\s*\{([\s\S]*?)\r?\n\}/.exec(src)?.[1] ?? ''
    return [...set.matchAll(/'(block-[a-z0-9-]+)'\s*:/g)].map((m) => m[1])
  } catch { return Object.keys(BLOCK_SET) }
}

/** Что рисует Preview: блок с данными его первого места на страницах элемента, иначе — первого кейса карточки. */
export function previewNode(name: string, lang: string): Node | null {
  if (!(name in BLOCK_SET)) return null
  for (const p of pageFiles(lang)) {
    const n = nodesOf(p.file).find((x) => x.kind === name)
    if (n) return n
  }
  const props = card(name)?.cases?.[0]?.props
  return props ? { kind: name, ...props } : null
}

export function sectionTitle(id: string, lang: string, sections = blockSections()): string {
  const s = sections.find((x) => x.id === id)
  return s ? (s.title[lang] ?? s.title.en) : id
}

export function elementBlockRows(lang: string): ElementBlockRow[] {
  const sections = blockSections()
  const l = lock()
  const files = pageFiles(lang).map((p) => ({ ...p, kinds: new Set(nodesOf(p.file).map((n) => n.kind)) }))
  const order = (id: string) => sections.find((s) => s.id === id)?.order ?? 999
  return registeredBlocks()
    .map((name) => {
      const built = name in BLOCK_SET
      const section = sectionOf(name, sections)
      return {
        name,
        section,
        sectionTitle: sectionTitle(section, lang, sections),
        description: card(name)?.use ?? readmeLine(name),
        origin: l[name] ? { from: 'catalogue' as const, version: l[name].version ?? '—' } : { from: 'template' as const },
        pages: files.filter((f) => f.kinds.has(name)).map((f) => f.path),
        previewable: built && previewNode(name, lang) !== null,
        built,
        href: `/${lang}/admin/blocks/${section}/${name}`,
      }
    })
    .sort((a, b) => order(a.section) - order(b.section) || a.name.localeCompare(b.name))
}
