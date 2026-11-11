import { SECTIONS, isSection, type SectionItem } from '@/components/sections'
import type { PageItem, FaqPair } from '@/lib/content/page-items'
import { resolveMarkdownLinks } from '@/lib/content/links'

// Тело страницы → markdown (шаг 505, AIO; 717-2: секция приносит свои слова из своей папки).
//
// ЗАЧЕМ. Публичная страница существует в двух видах: HTML для человека и markdown
// для машины. Второй нужен затем, что модель, пришедшая за содержимым сайта,
// разбирает разметку страницы вместе с меню, подвалом, баннером согласия и
// скриптами — и половину контекста тратит на то, что к содержимому отношения не
// имеет. Markdown отдаёт ровно текст.
//
// 🔒 ИСТОЧНИК ОДИН. Обе формы собираются из ОДНИХ И ТЕХ ЖЕ частей тела, поэтому
// разойтись не могут: отредактировал текст — изменились обе. Отдельный файл с
// «версией для ИИ» разошёлся бы с сайтом на первой же правке, и никто бы этого
// не заметил, потому что в браузере его никто не открывает.
//
// Инлайновая разметка (`**жирный**`, `[метка](адрес)`) в наших частях страницы УЖЕ
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

function lines(item: PageItem, widget?: WidgetText): string[] {
  // 717-2: a section brings its own words (`components/sections/<kind>/markdown.ts`).
  if (isSection(item.kind)) return (SECTIONS[item.kind].markdown as (s: unknown) => string[])(item)
  // 428: виджет ветки несёт свой текст (лендинг — поле `landing` данных, форма — свои строки), и в копию он приходит через
  // `markdown(lang)` в папке виджета. 🪦 Здесь стояло «его слова уже в машинной версии» — неверно: главная отдавала 159 байт.
  if (item.kind.startsWith('widget-')) {
    const text = widget ? widget(item.kind).trim() : ''
    return text ? [text] : []
  }
  const text = item as Exclude<PageItem, { kind: `widget-${string}` } | SectionItem>
  // 717-2: здесь остаётся только текст — секция приносит свои слова сама (`markdown.ts` своей папки, без него набор не соберётся).
  // Проверка ИСЧЕРПЫВАЮЩАЯ: новый `text-*` в `lib/content/page-items.ts` без своей строки здесь не соберётся (`never` ниже).
  switch (text.kind) {
    // 423: типографика элемента — сама почти Markdown.
    case 'text-h2':
      return [`## ${text.text}`]
    case 'text-h3':
      return [`### ${text.text}`]
    case 'text-h4':
      return [`#### ${text.text}`]
    case 'text-p':
    case 'text-lead':
    case 'text-small':
      return [text.text]
    case 'text-list':
      return text.items.map((t, i) => (text.ordered ? `${i + 1}. ${t}` : `- ${t}`))
    case 'text-quote':
      return [`> ${text.text}`, ...(text.cite ? [`> — ${text.cite}`] : [])]
    case 'text-code':
      return ['```', text.text, '```']
    case 'text-table': {
      const row = (cells: string[]) => `| ${cells.map((c) => c.replace(/\|/g, '\\|')).join(' | ')} |`
      const RULE: Record<string, string> = { left: ':---', center: ':---:', right: '---:' }
      const rule = text.head.map((_, i) => RULE[text.align?.[i] ?? ''] ?? '---')
      return [row(text.head), `| ${rule.join(' | ')} |`, ...text.rows.map(row)]
    }
    default: {
      const unhandled: never = text
      return unhandled
    }
  }
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
export function pageToMarkdown(body: PageItem[], siteName: string, widget?: WidgetText): string {
  return resolveMarkdownLinks(
    body
      .flatMap(b => [...lines(b, widget), ''])
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      // 717-9: a section that brings its own heading (questions and answers) right after `section-head` of the same words — the page
      // draws the heading once, the twin says it once too (same level, same words; the first stays).
      .replace(/^(#{1,6}) (.+)\n\n\1 \2$/gm, '$1 $2')
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
 * Форма пары — `{ q, a }` из набора секций (`FaqPair`), а не
 * `{ question, answer }`: типы поймали это на сборке, и подгонять надо код под
 * набор, а не наоборот — набор читают ещё и разметка страницы, и JSON-LD.
 */
export function faqToMarkdown(faq?: FaqPair[]): string {
  if (!faq?.length) return ''
  return ['## FAQ', '', ...faq.flatMap(f => [`### ${f.q}`, '', f.a, ''])].join('\n').trim()
}
