import type { ReactNode } from 'react'
import type { Block } from '@/lib/content/blocks/types'
import { renderBlocks } from '@/lib/content/blocks/registry'

/** Виджеты ветки: имя → отрисовка на языке страницы (`<ветка>/_widgets/index.tsx`). */
export type WidgetSet = Record<string, (lang: string) => ReactNode>

// PostBody — тонкая обёртка над набором блоков элемента (`lib/content/blocks/registry.tsx`, фабрика `page-body` из
// «Блоков»). Любая поверхность с содержимым рисует блоки одинаково; новый вид добавляется в одном месте (314-2).
export function PostBody({ blocks, lang = 'en', widgets }: { blocks: Block[]; lang?: string; widgets?: WidgetSet }) {
  // 423: виджет ветки стоит в последовательности на своём месте; фабрике он приходит уже привязанным к языку.
  const set = widgets ? Object.fromEntries(Object.entries(widgets).map(([name, draw]) => [name, () => draw(lang)])) : undefined
  return <div className="flex flex-col gap-6">{renderBlocks(blocks, 'blk', set)}</div>
}
