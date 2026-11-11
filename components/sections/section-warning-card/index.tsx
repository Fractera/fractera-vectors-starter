import { H4, Small } from '@/components/ui/typography'
import { inline } from '@/lib/content/inline'

// ТРЕВОЖНАЯ КАРТОЧКА (314-2, слово владельца: «Добавь ещё сюда карточку тревожная»). Жанр — предупреждение: сообщает цену или
// риск решения, которое человек вот-вот примет. Тон — токены `destructive` темы, ни одного своего цвета или размера числом.
export type WarningCardProps = { itemKey?: string; title: string; text: string }

export function WarningCard({ itemKey: k = 'warning', title, text }: WarningCardProps) {
  return (
    <aside data-block="ban00" role="note" aria-labelledby={`${k}-t`} className="my-6 flex flex-col gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-6">
      <H4 data-block="kmr5b" id={`${k}-t`} className="text-destructive">{title}</H4>
      <Small data-block="lfmvg" className="text-foreground">{inline(text, `${k}-x`)}</Small>
    </aside>
  )
}

// 717-2: the set (`components/sections/index.ts`) reads this section by these names — the component, its fields in page data
// and its words in the Markdown twin (`./markdown.ts`).
export { WarningCard as Section }
export type Shape = { title: string; text: string }
export { markdown } from './markdown'
