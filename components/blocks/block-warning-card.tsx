import { H4, Small } from '@/components/ui/typography'
import { inline } from '@/lib/blocks/inline'

// ТРЕВОЖНАЯ КАРТОЧКА (314-2, слово владельца: «Добавь ещё сюда карточку тревожная»). Жанр — предупреждение: сообщает цену или
// риск решения, которое человек вот-вот примет. Тон — токены `destructive` темы, ни одного своего цвета или размера числом.
export type WarningCardProps = { blockKey?: string; title: string; text: string }

export function WarningCard({ blockKey: k = 'warning', title, text }: WarningCardProps) {
  return (
    <aside role="note" aria-labelledby={`${k}-t`} className="my-6 flex flex-col gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-6">
      <H4 id={`${k}-t`} className="text-destructive">{title}</H4>
      <Small className="text-foreground">{inline(text, `${k}-x`)}</Small>
    </aside>
  )
}
