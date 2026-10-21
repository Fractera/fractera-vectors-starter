import { H1, H5, Lead, Small, Eyebrow } from '@/components/ui/typography'
import { CtaButton } from '@/components/blocks/block-cta-button'
import { inline } from '@/lib/blocks/inline'

// Первый экран по центру (303-2, образец владельца 2026-09-26): подсветка фирменным цветом → бейдж → заголовок
// не длиннее двух строк → описание → кнопка → полоса из трёх шагов. Картинки и логотипа нет.
//
// 🔒 ВСЁ ИЗ ДИЗАЙН-СИСТЕМЫ: шрифты — примитивы типографики (H1 на переменных `--fs-hero-one*`, H5, Small, Eyebrow),
// цвета — токены темы, подсветка `.hero-ignite*`, появление `.hero-appear`, каёмка бейджа `.pill-ai` — классы
// globals.css проекта. Образец владельца задавал цвета и размеры числами; здесь ни одного такого числа.
// 🔒 H1 ЗДЕСЬ: страница, взявшая этот блок, свой заголовок не печатает — H1 на странице один.
type Step = { title: string; text: string }
export type HeroCenteredProps = {
  blockKey?: string
  pill?: string
  title: string
  description: string
  cta?: { label: string; href: string }
  /** 314-2: вторая кнопка рядом с главной, в обводке. Необязательна: без неё блок прежний. */
  secondary?: { label: string; href: string }
  steps?: [Step, Step, Step]
}

// Две строки максимум, дальше многоточие.
// 🔒 ШИРИНА — ДО 1250px (владелец 2026-09-26: «сделай по умолчанию ширину максимум 1250»): секция, заголовок и полоса
// шагов; описание уже — для удобства чтения. Число — переменная темы `--hero-one-w`, запасное значение 1250px.
const TITLE = 'mx-auto w-full line-clamp-2 text-balance text-[length:var(--fs-hero-one,1.95rem)] md:text-[length:var(--fs-hero-one-md,2.4375rem)] lg:text-[length:var(--fs-hero-one-lg,2.925rem)] leading-tight'

export function HeroCentered({ blockKey: k = 'hero', pill, title, description, cta, secondary, steps }: HeroCenteredProps) {
  return (
    <section aria-labelledby={`${k}-t`} className="relative isolate mx-auto mb-6 flex w-full max-w-[var(--hero-one-w,1250px)] flex-col px-6 pt-10 pb-4 text-center">
      {/* 🔒 ЗАРЕВО НАЧИНАЕТСЯ ОТ ВЕРХА СТРАНИЦЫ, А НЕ ОТ КРАЯ СЕКЦИИ (владелец 2026-09-26, снимок): обрезанное секцией,
          оно давало прямую кромку под крошками — экран читался отдельным прямоугольником, опущенным от шапки.
          Слой выходит вверх на 7rem (поля страницы и крошки) и гаснет к краям сам, поэтому обрезка не нужна. */}
      <div aria-hidden className="hero-ignite pointer-events-none absolute inset-x-0 -top-28 bottom-0 -z-10" />
      <div aria-hidden className="hero-ignite-inner pointer-events-none absolute inset-x-[15%] -top-28 bottom-0 -z-10" />

      {pill && (
        <div className="hero-appear mb-6 flex justify-center [animation-delay:0.3s]">
          <span className="pill-ai inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-foreground">
            <span aria-hidden className="text-base leading-none text-primary">✦</span>
            {pill}
          </span>
        </div>
      )}
      <H1 id={`${k}-t`} className={`hero-appear [animation-delay:0.5s] ${TITLE}`}>{title}</H1>
      <Lead className="hero-appear mx-auto mt-5 max-w-xl [animation-delay:0.65s]">{inline(description, `${k}-d`)}</Lead>
      {(cta || secondary) && (
        <div className="hero-appear mt-8 flex flex-wrap justify-center gap-3 [animation-delay:0.75s]">
          {cta && <CtaButton href={cta.href}>{cta.label}</CtaButton>}
          {secondary && <CtaButton href={secondary.href} variant="outline">{secondary.label}</CtaButton>}
        </div>
      )}

      {steps && (
        // Телефон — столбик строк с разделителями; с планшета — ряд из трёх колонок с разделителями между ними.
        <ol className="hero-appear mx-auto mt-12 grid w-full list-none divide-y divide-border/60 overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-0 text-left backdrop-blur-md [animation-delay:0.8s] md:grid-cols-3 md:divide-x md:divide-y-0 md:text-center">
          {steps.map((s, i) => (
            <li key={`${k}-s${i}`} className="flex items-center gap-3 px-4 py-3.5 md:flex-col md:gap-2 md:px-6 md:py-5">
              <Eyebrow className="font-mono font-normal text-muted-foreground">{String(i + 1).padStart(2, '0')}</Eyebrow>
              <span className="flex flex-col gap-1">
                <H5>{s.title}</H5>
                <Small>{inline(s.text, `${k}-s${i}-t`)}</Small>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
