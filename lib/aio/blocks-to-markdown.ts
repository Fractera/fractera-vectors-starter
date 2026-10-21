import type { Block, FaqPair } from '@/lib/content/blocks/types'
import { resolveMarkdownLinks } from '@/lib/content/blocks/links'

// Блоки страницы → markdown (шаг 505, AIO).
//
// ЗАЧЕМ. Публичная страница существует в двух видах: HTML для человека и markdown
// для машины. Второй нужен затем, что модель, пришедшая за содержимым сайта,
// разбирает разметку страницы вместе с меню, подвалом, баннером согласия и
// скриптами — и половину контекста тратит на то, что к содержимому отношения не
// имеет. Markdown отдаёт ровно текст.
//
// 🔒 ИСТОЧНИК ОДИН. Обе формы собираются из ОДНИХ И ТЕХ ЖЕ блоков, поэтому
// разойтись не могут: отредактировал текст — изменились обе. Отдельный файл с
// «версией для ИИ» разошёлся бы с сайтом на первой же правке, и никто бы этого
// не заметил, потому что в браузере его никто не открывает.
//
// Инлайновая разметка (`**жирный**`, `[метка](адрес)`) в наших блоках УЖЕ
// markdown — переносится как есть.
//
// 🔒 КРОМЕ ОДНОЙ ФОРМЫ, И ИМЕННО НА НЕЙ ЭТО ОБЕЩАНИЕ ЛОМАЛОСЬ (2026-08-17).
// Ссылка на корень пишется `[%SITE%](/en)` — это не markdown, а соглашение
// проекта, которое раскрывает рендерер: подпись становится названием сайта.
// Машинная версия «переносила как есть» и отдавала дословный `%SITE%` с
// относительным адресом, который вне сайта не разрешается ни во что. То есть
// ровно та ссылка, ради которой правило и придумано, до машины не доезжала.
// Раскрывает её теперь `resolveMarkdownLinks` — там же, где живут все прочие
// решения о ссылках, чтобы обе формы страницы не разошлись снова.

/** Текст виджета по его имени (`_widgets/markdown.ts` ветки); виджет без текста — пустая строка. */
export type WidgetText = (kind: string) => string

function lines(block: Block, widget?: WidgetText): string[] {
  // 314-2: виды набора элемента (`lib/content/blocks/registry.tsx`). Новый вид в наборе — строка здесь той же правкой,
  // иначе машинная версия страницы молча теряет его текст.
  switch (block.kind) {
    case 'block-section-head':
      return [`## ${block.title}`]
    case 'block-hero-centered':
      return [
        ...(block.pill ? [`_${block.pill}_`, ''] : []),
        `# ${block.title}`,
        '',
        block.description,
        ...(block.cta ? ['', `[${block.cta.label}](${block.cta.href})`] : []),
        ...(block.secondary ? [`[${block.secondary.label}](${block.secondary.href})`] : []),
      ]
    case 'block-warning-card':
      return [`> **${block.title}** ${block.text}`]
    // 423: типографика элемента — сама почти Markdown.
    case 'text-h2':
      return [`## ${block.text}`]
    case 'text-h3':
      return [`### ${block.text}`]
    case 'text-h4':
      return [`#### ${block.text}`]
    case 'text-p':
    case 'text-lead':
    case 'text-small':
      return [block.text]
    case 'text-list':
      return block.items.map((t, i) => (block.ordered ? `${i + 1}. ${t}` : `- ${t}`))
    case 'text-quote':
      return [`> ${block.text}`, ...(block.cite ? [`> — ${block.cite}`] : [])]
    case 'text-code':
      return ['```', block.text, '```']
    case 'text-table': {
      const row = (cells: string[]) => `| ${cells.map((c) => c.replace(/\|/g, '\\|')).join(' | ')} |`
      const RULE: Record<string, string> = { left: ':---', center: ':---:', right: '---:' }
      const rule = block.head.map((_, i) => RULE[block.align?.[i] ?? ''] ?? '---')
      return [row(block.head), `| ${rule.join(' | ')} |`, ...block.rows.map(row)]
    }
  }
  // 428: виджет ветки несёт свой текст (лендинг — поле `landing` данных, форма — свои строки), и в копию он приходит через
  // `markdown(lang)` в папке виджета. 🪦 Здесь стояло «его слова уже в машинной версии» — неверно: главная отдавала 159 байт.
  const kind = (block as { kind: string }).kind
  if (widget && kind.startsWith('widget-')) {
    const text = widget(kind).trim()
    return text ? [text] : []
  }
  return []
}

/**
 * 🔒 `siteName` ОБЯЗАТЕЛЕН, И ЭТО ИСПРАВЛЕНИЕ, А НЕ УДОБСТВО (2026-08-17).
 *
 * Комментарий вверху файла обещал, что инлайновая разметка «уже markdown и
 * переносится как есть». Для жирного и обычных ссылок это правда, для одной
 * формы — нет: `[%SITE%](/en)` раскрывает рендерер, и без него машина получала
 * дословный `%SITE%` и относительный адрес, который вне сайта не разрешается ни
 * во что. Параметр сделан ОБЯЗАТЕЛЬНЫМ намеренно: с умолчанием следующая
 * поверхность молча забыла бы его передать, и дефект вернулся бы туда же.
 */
export function blocksToMarkdown(blocks: Block[], siteName: string, widget?: WidgetText): string {
  return resolveMarkdownLinks(
    blocks
      .flatMap(b => [...lines(b, widget), ''])
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    siteName,
  )
    // Узел, шаг 450-1: голый `%SITE%` (заголовок секции, пункт списка) — тоже имя сайта, как на самой странице.
    .split('%SITE%')
    .join(siteName)
}

/**
 * Вопросы и ответы отдельным разделом.
 *
 * Форма пары — `{ q, a }` из общего каталога блоков (`FaqPair`), а не
 * `{ question, answer }`: типы поймали это на сборке, и подгонять надо код под
 * каталог, а не наоборот — каталог читают ещё и разметка страницы, и JSON-LD.
 */
export function faqToMarkdown(faq?: FaqPair[]): string {
  if (!faq?.length) return ''
  return ['## FAQ', '', ...faq.flatMap(f => [`### ${f.q}`, '', f.a, ''])].join('\n').trim()
}
