import { H2, H3, H4, Lead, P, Small } from '@/components/ui/typography'
import { inline } from '@/lib/blocks/inline'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { BlockSet } from '@/components/blocks/page-body'

// ТИПОГРАФИКА СТРАНИЦЫ — третий вид элемента страницы (узел, шаг 423; владелец 2026-10-07: страница — последовательность
// виджетов, блоков «и обычной Typography»). Блок — оформленная секция из реестра «Блоков»; виджет — работа ветки; `text-*` —
// голый текст, нарисованный примитивами `components/ui/typography` и токенами «Дизайна». Живёт в элементе, не в реестре:
// это его дизайн-система. Внутри строки — `**жирный**`, `*курсив*`, код в обратных кавычках и `[ссылка](адрес)` (`inline`); 458-4 — таблица `text-table`.
// 🔒 `text-h1` нет намеренно: заголовок H1 страницы ставит фабрика из `title`, второй H1 вредит поиску.

type Text = { blockKey?: string; text: string; id?: string }

export const TEXT_SET: BlockSet = {
  'text-h2': ({ blockKey: k = 'h2', text, id }: Text) => <H2 id={id}>{inline(text, k)}</H2>,
  'text-h3': ({ blockKey: k = 'h3', text, id }: Text) => <H3 id={id}>{inline(text, k)}</H3>,
  'text-h4': ({ blockKey: k = 'h4', text, id }: Text) => <H4 id={id}>{inline(text, k)}</H4>,
  'text-p': ({ blockKey: k = 'p', text }: Text) => <P className="leading-8">{inline(text, k)}</P>,
  'text-lead': ({ blockKey: k = 'lead', text }: Text) => <Lead>{inline(text, k)}</Lead>,
  'text-small': ({ blockKey: k = 'small', text }: Text) => <Small>{inline(text, k)}</Small>,
  'text-list': ({ blockKey: k = 'list', items, ordered }: { blockKey?: string; items: string[]; ordered?: boolean }) => {
    const Tag = ordered ? 'ol' : 'ul'
    return (
      <Tag className={`${ordered ? 'list-decimal' : 'list-disc'} space-y-2 pl-6 leading-8 text-foreground`}>
        {items.map((t, i) => <li key={`${k}-${i}`}>{inline(t, `${k}-${i}`)}</li>)}
      </Tag>
    )
  },
  'text-quote': ({ blockKey: k = 'quote', text, cite }: Text & { cite?: string }) => (
    <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
      <P className="leading-8">{inline(text, k)}</P>
      {cite ? <Small>— {cite}</Small> : null}
    </blockquote>
  ),
  // 458-4: таблица — рамка и строки примитивов shadcn `components/ui/table`; на телефоне таблица прокручивается вбок внутри себя.
  'text-table': ({ blockKey: k = 'table', head, rows, align }: { blockKey?: string; head: string[]; rows: string[][]; align?: ('left' | 'center' | 'right' | null)[] }) => {
    const cls = (i: number) => (align?.[i] === 'center' ? 'text-center' : align?.[i] === 'right' ? 'text-right' : '')
    return (
      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>{head.map((h, i) => <TableHead key={`${k}-h${i}`} className={`whitespace-normal ${cls(i)}`}>{inline(h, `${k}-h${i}`)}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, ri) => (
              <TableRow key={`${k}-r${ri}`}>
                {r.map((c, ci) => <TableCell key={`${k}-${ri}-${ci}`} className={`whitespace-normal align-top leading-7 ${cls(ci)}`}>{inline(c, `${k}-${ri}-${ci}`)}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  },
  'text-code': ({ text }: Text) => (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 text-sm"><code>{text}</code></pre>
  ),
}
