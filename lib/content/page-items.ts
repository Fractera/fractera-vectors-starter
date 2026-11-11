import type { SectionItem } from '@/components/sections'
// ЧАСТИ ТЕЛА СТРАНИЦЫ — `body` в `<язык>.json` (шаги 314-2, 717-2): секции этого элемента, текст и виджеты ветки.
//
// Секция — собственный компонент элемента, папка `components/sections/<вид>/`; их пишет дизайн-проход по брифу
// (`.claude/modes/build-design.md`). Их поля здесь не перечисляются: `SectionItem` выводится из набора `components/sections/index.ts`.
// Неизвестный вид фабрика `page-body` называет громко.

export type Link = { label: string; href: string }

/**
 * Постоянный адрес части страницы (317-1): буква + 4 знака base36, один на всех языках. По нему подсветка в Preview называет её
 * («Block: k3f9a»), а агент находит её в файле. Ставит и проверяет `scripts/check-block-ids.mjs` (`npm run blocks:ids`).
 */
type Addressed = { bid?: string }

export type PageItem = Addressed & (
  // 717-2: the sections of this element — their fields live in their folders (`components/sections/<kind>/index.tsx`).
  | SectionItem
  // 423: типографика элемента (`lib/content/text-set.tsx`) — третий вид рядом с секциями и виджетами.
  | { kind: 'text-h2' | 'text-h3' | 'text-h4'; text: string; id?: string }
  | { kind: 'text-p' | 'text-lead' | 'text-small' | 'text-code'; text: string }
  | { kind: 'text-list'; items: string[]; ordered?: boolean }
  | { kind: 'text-quote'; text: string; cite?: string }
  // 458-4: таблица — документы Lagrix несут таблицы (словарь, риски, перечень документов). Ячейки — строки с разметкой в строке.
  | { kind: 'text-table'; head: string[]; rows: string[][]; align?: ('left' | 'center' | 'right' | null)[] }
  // 423: виджет своей ветки на своём месте в последовательности (`<ветка>/_widgets/index.tsx`).
  | { kind: `widget-static-${string}` | `widget-dynamic-${string}` }
)

/** Вопрос и ответ раздела FAQ — рисует секция `section-faq`, она же ставит разметку `FAQPage`. */
export type FaqPair = { q: string; a: string }

/** Строка оглавления (`components/content-page/toc.tsx`). */
export type TocItem = { id: string; text: string; children?: { id: string; text: string }[] }
