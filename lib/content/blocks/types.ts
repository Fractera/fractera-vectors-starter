// ВИДЫ БЛОКОВ, КОТОРЫЕ СТОЯТ В ЭТОМ ЭЛЕМЕНТЕ (шаг 314-2).
//
// 🪦 КАТАЛОГ НА 60+ ВИДОВ И ПАПКА `sections/` УДАЛЕНЫ ИЗ ШАБЛОНА по слову владельца 2026-09-26: «Мы же сделали для этого
// специально отдельный микро service который управляет блоками … мы должны передать навык которые позволит ему самому
// определять стоит он забирать хочет или нет через MCP блоки». Блоки живут в элементе «Блоки»; элемент берёт себе только
// нужные командой `npx shadcn add @fractera/<имя>` (адрес реестра — `BLOCKS_REGISTRY_URL`) и владеет копией.
//
// 🔒 ОДИН ВИД ЗДЕСЬ — ОДИН ПОСТАВЛЕННЫЙ БЛОК В `components/blocks/` И ОДНА СТРОКА В `lib/content/blocks/registry.tsx`.
// Имя вида — имя блока в реестре «Блоков» (`hero-centered`): фабрика `page-body` на неизвестный вид падает с командой
// установки именно этого имени.

export type Link = { label: string; href: string }

/**
 * Постоянный адрес блока (317-1): буква + 4 знака base36, один на всех языках. По нему подсветка в Preview называет блок,
 * а агент находит его в файле. Ставит и проверяет `scripts/check-block-ids.mjs` (`npm run blocks:ids`).
 */
type Addressed = { bid?: string }

export type Block = Addressed & (
  | { kind: 'block-section-head'; id: string; title: string; badge?: string }
  | { kind: 'block-hero-centered'; pill?: string; title: string; description: string; cta?: Link; secondary?: Link }
  | { kind: 'block-warning-card'; title: string; text: string }
  // 423: типографика элемента (`lib/content/text-set.tsx`) — третий вид рядом с блоками и виджетами.
  | { kind: 'text-h2' | 'text-h3' | 'text-h4'; text: string; id?: string }
  | { kind: 'text-p' | 'text-lead' | 'text-small' | 'text-code'; text: string }
  | { kind: 'text-list'; items: string[]; ordered?: boolean }
  | { kind: 'text-quote'; text: string; cite?: string }
  // 458-4: таблица — документы Lagrix несут таблицы (словарь, риски, перечень документов). Ячейки — строки с разметкой в строке.
  | { kind: 'text-table'; head: string[]; rows: string[][]; align?: ('left' | 'center' | 'right' | null)[] }
  // 423: виджет своей ветки на своём месте в последовательности (`<ветка>/_widgets/index.tsx`).
  | { kind: `widget-static-${string}` | `widget-dynamic-${string}` }
)

/** Вопрос и ответ раздела FAQ — рисует блок `faq` из «Блоков», он же ставит разметку `FAQPage`. */
export type FaqPair = { q: string; a: string }

/** Строка оглавления. Оглавления в «Блоках» нет; тип остаётся для данных, которые его несут. */
export type TocItem = { id: string; text: string; children?: { id: string; text: string }[] }
