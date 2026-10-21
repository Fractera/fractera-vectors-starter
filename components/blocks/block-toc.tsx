import type { Block, TocItem } from '@/lib/content/blocks/types'

// ОГЛАВЛЕНИЕ СТРАНИЦЫ (шаг узла 458-8). Владелец 2026-10-12: «каждой странице должна содержать элементы TOC, он у нас существует
// на соответствующих примерах на вкладке блок … извлеки и примени». Рисунок перенесён из «Блоков» без изменений —
// `WEB4-ITEMS/user/blocks/registry/src/sections/blocks/toc.server.tsx` (вид каталога секций `toc`, «page material»): в реестр
// установки он не выложен, поэтому лежит здесь файлом, как остальные `block-*`.
//
// 🔒 СПИСОК СТРОИТ ТОТ, КТО ДЕРЖИТ СТРАНИЦУ ЦЕЛИКОМ, А НЕ АВТОР (закон вида в «Блоках»): из `text-h2` (разделы) и `text-h3`
// (подразделы), с теми же `id`, что печатают сами заголовки, — якоря совпадают по построению и слова не устаревают.
// Отличие от образца одно: `aria-label` — подпись на языке страницы, а не английское «Contents» (долг, названный в образце).

export const slugOfHeading = (s: string) =>
  s.toLowerCase().replace(/[`*_[\]()]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '')

/** Заголовкам без `id` — `id` из их текста (уникальный на странице): оглавлению нужен адрес каждого. */
export function withHeadingIds(blocks: Block[]): Block[] {
  const seen = new Map<string, number>()
  return blocks.map((b) => {
    if (b.kind !== 'text-h2' && b.kind !== 'text-h3') return b
    const base = b.id || slugOfHeading(b.text) || 'section'
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    const id = n ? `${base}-${n + 1}` : base
    return id === b.id ? b : { ...b, id }
  })
}

const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '')

/** Разделы (`text-h2`) и их подразделы (`text-h3`) — после `withHeadingIds`. */
export function tocOf(blocks: Block[]): TocItem[] {
  const items: TocItem[] = []
  for (const b of blocks) {
    if (b.kind === 'text-h2' && b.id) items.push({ id: b.id, text: plain(b.text), children: [] })
    else if (b.kind === 'text-h3' && b.id && items.length) items[items.length - 1].children!.push({ id: b.id, text: plain(b.text) })
  }
  return items
}

/** Оглавление — от двух разделов: один раздел оглавлять незачем. */
export function Toc({ items, heading }: { items: TocItem[]; heading: string }) {
  if (items.length < 2) return null
  return (
    <nav data-block="tc458" aria-label={heading} className="mt-8 rounded-2xl border border-border bg-muted/40 p-5">
      <p data-block="tc459" className="text-xs font-semibold uppercase tracking-widest text-primary">
        {heading} · {items.reduce((n, i) => n + 1 + (i.children?.length ?? 0), 0)}
      </p>
      <ol data-block="tc460" className="mt-3 flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={item.id} className="flex flex-col gap-2 text-[15px] leading-snug">
            <span className="flex gap-3">
              <span aria-hidden className="select-none font-mono text-sm text-muted-foreground">
                {String(i + 1).padStart(2, '0')}
              </span>
              <a href={`#${item.id}`} className="text-muted-foreground transition-colors hover:text-primary">
                {item.text}
              </a>
            </span>
            {/* Второй уровень: подразделы своего раздела. Номера им не даются — отступа и точки достаточно. */}
            {item.children && item.children.length > 0 && (
              <ul className="ml-9 flex flex-col gap-1.5">
                {item.children.map((sub) => (
                  <li key={sub.id} className="flex gap-2 text-sm leading-snug">
                    <span aria-hidden className="select-none text-muted-foreground">·</span>
                    <a href={`#${sub.id}`} className="text-muted-foreground transition-colors hover:text-primary">
                      {sub.text}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
