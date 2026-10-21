import { H1 } from "@/components/ui/typography"
import { referenceTitle } from "./words"

// Главная эталонного стартового шаблона (узел, шаг 542; владелец 2026-10-19: «главная страница должна иметь просто в центре надпись
// эталонный стартовый шаблон. И больше ничего на этой странице быть не должно»). Одна надпись по центру экрана; жёлтая вывеска
// стартера — в `app/[lang]/layout.tsx` (компонент `components/shell/starter-banner.client.tsx`), не здесь.
export function ReferenceTitle({ lang }: { lang: string }) {
  return (
    <section data-block="rf0s1" className="flex min-h-[70vh] w-full items-center justify-center px-6">
      <H1 data-block="rf0h1" className="text-center">{referenceTitle(lang)}</H1>
    </section>
  )
}
