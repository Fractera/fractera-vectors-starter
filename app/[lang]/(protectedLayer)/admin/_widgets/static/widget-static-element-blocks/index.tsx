import { elementBlockRows, blockSections, type ElementBlockRow } from '../../../_libs/element-blocks'
import { elementBlocksUi, type ElementBlocksUi } from './ui.i18n'
import { ElementBlocksTable, type Row } from './table.client'

// ВИДЖЕТ «БЛОКИ ЭТОГО ЭЛЕМЕНТА» (577-11) — на странице `admin/blocks` (`_pages/blocks/`) и на странице раздела
// (`admin/blocks/<раздел>`). Строки считает сервер из файлов элемента (`../../../_libs/element-blocks.ts`) при каждой отрисовке, таблица
// листает их в браузере и помнит место (577-12). Слова — `ui.i18n.ts`.
export function toRows(list: ElementBlockRow[], ui: ElementBlocksUi): Row[] {
  return list.map((r) => ({
    name: r.name,
    section: r.sectionTitle,
    description: r.description,
    origin: r.origin.from === 'catalogue' ? ui.fromCatalogue.replace('{version}', r.origin.version) : ui.fromTemplate,
    catalogue: r.origin.from === 'catalogue',
    pages: r.pages.length ? r.pages.join(', ') : ui.nowhere,
    previewable: r.previewable,
    built: r.built,
    href: r.href,
  }))
}

export function ElementBlocks({ lang, section }: { lang: string; section?: string }) {
  const ui = elementBlocksUi(lang)
  const all = elementBlockRows(lang)
  const list = section ? all.filter((r) => r.section === section) : all
  if (section && !list.length) return <p data-block="ebw01" className="text-sm text-muted-foreground">{ui.sectionEmpty}</p>
  const table = <ElementBlocksTable rows={toRows(list, ui)} ui={ui} scope={section ? `section:${section}` : 'all'} showSection={!section} />
  if (section) return table
  // Все разделы — папки `_pages/blocks/<раздел>/`, пустые тоже (владелец: «структуру можно воссоздать сразу даже если она внутри останется пустой»).
  return (
    <div data-block="ebw02" className="flex flex-col gap-6">
      <nav data-block="ebw03" aria-label={ui.cols.section} className="flex flex-wrap gap-2">
        {blockSections().map((s) => {
          const n = all.filter((r) => r.section === s.id).length
          return (
            <a key={s.id} href={`/${lang}/admin/blocks/${s.id}`} className={`rounded-full border border-border px-3 py-1 text-xs hover:bg-muted ${n ? 'text-foreground' : 'text-muted-foreground'}`}>
              {s.title[lang] ?? s.title.en} · {n}
            </a>
          )
        })}
      </nav>
      {table}
    </div>
  )
}
