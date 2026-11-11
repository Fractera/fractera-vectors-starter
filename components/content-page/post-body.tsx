import type { ReactNode } from 'react'
import type { PageItem } from '@/lib/content/page-items'
import { renderPage, type KindSet } from '@/components/sections/page-body'

/** Виджеты ветки: имя → отрисовка на языке страницы (`<ветка>/_widgets/index.tsx`). */
export type WidgetSet = Record<string, (lang: string) => ReactNode>

// PostBody — тонкая обёртка над набором секций элемента (`components/sections/index.ts`, фабрика `page-body`).
// Любая поверхность с содержимым рисует тело одинаково; новая секция — одна папка и строка набора (314-2, 717-2).
// 717-3: `moreSections` — sections this page draws besides the element's set: a design prototype's own, until the pin.
export function PostBody({ body, lang = 'en', widgets, moreSections }: { body: PageItem[]; lang?: string; widgets?: WidgetSet; moreSections?: KindSet }) {
  // 423: виджет ветки стоит в последовательности на своём месте; фабрике он приходит уже привязанным к языку.
  const bound = widgets ? Object.fromEntries(Object.entries(widgets).map(([name, draw]) => [name, () => draw(lang)])) : undefined
  const set = moreSections ? { ...moreSections, ...bound } : bound
  return <div className="flex flex-col gap-6">{renderPage(body, 'blk', set)}</div>
}
