import type { ReactNode } from 'react'
import { PageBody, type BlockSet } from '@/components/blocks/page-body'
import { SectionHead } from '@/components/blocks/block-section-head'
import { HeroCentered } from '@/components/blocks/block-hero-centered'
import { WarningCard } from '@/components/blocks/block-warning-card'
import { Faq } from '@/components/blocks/block-faq'
import type { Block } from './types'
import { TEXT_SET } from '@/lib/content/text-set'

// НАБОР БЛОКОВ ЭТОГО ЭЛЕМЕНТА И ОТРИСОВКА СТРАНИЦЫ (шаг 314-2).
//
// 🔒 РИСУЕТ ФАБРИКА `page-body` ИЗ «БЛОКОВ», А НЕ СВОЙ КАТАЛОГ. Здесь только набор — какие блоки стоят в проекте. Новый
// блок: `npx shadcn add @fractera/<имя>` → строка в наборе → вид в `types.ts`. Вид без строки — ошибка сборки
// с командой установки, а не пустое место на странице.
// 🪦 Прежняя отрисовка через `sections/` (62 вида) удалена вместе с каталогом.

export const BLOCK_SET: BlockSet = {
  'block-section-head': SectionHead,
  'block-hero-centered': HeroCentered,
  'block-warning-card': WarningCard,
  'block-faq': Faq,
}

/** Нарисовать список блоков по порядку; `keyPrefix` держит ключи уникальными между вызовами на одной странице. */
/** 423: страница — последовательность трёх видов: `block-*` (набор выше), `text-*` (типографика элемента), `widget-*` (виджеты
 *  ветки — `widgets`, уже привязанные к языку). Незнакомое имя — громкая ошибка фабрики, а не пустое место. */
export function renderBlocks(blocks: (Block | { kind: 'block-faq'; title: string; items: { q: string; a: string }[] })[], keyPrefix = 'blk', widgets?: BlockSet): ReactNode {
  return <PageBody key={keyPrefix} blocks={blocks} set={{ ...BLOCK_SET, ...TEXT_SET, ...(widgets ?? {}) }} />
}
