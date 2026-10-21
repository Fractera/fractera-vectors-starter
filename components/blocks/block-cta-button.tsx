import Link from 'next/link'
import type { ReactNode } from 'react'

// Кнопка главного действия — тот же вид, что `CtaButton` первого экрана сайта (`sections/cta-button.server.tsx`):
// пилюля цвета `--primary`, жирный текст, стрелка. Всё из токенов темы — ни одного своего цвета или размера числом.
// Блок реестра, а не импорт из `sections/`: проект получает его командой `shadcn add` вместе с первым экраном.
// 314-2: вид `outline` — вторая кнопка рядом с главной (обводка вместо заливки). Умолчание — прежняя пилюля без изменений.
const LOOK = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-border bg-background/60 text-foreground hover:bg-muted/60',
} as const

export function CtaButton({ href, children, variant = 'primary' }: { href: string; children: ReactNode; variant?: keyof typeof LOOK }) {
  return (
    <Link
      href={href}
      className={`inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold ${LOOK[variant]}`}
    >
      {children}
      <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </Link>
  )
}
