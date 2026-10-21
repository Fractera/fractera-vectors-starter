"use client"

import { useState, type ReactNode } from "react"
import { Check, Copy, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { H3, Small } from "@/components/ui/typography"

// ОБЩИЕ СТУПЕНИ ЛЕСТНИЦЫ НАСТРОЙКИ ПРОВАЙДЕРА (266-1).
//
// 🔒 ВЫНЕСЕНЫ ИЗ ЭКРАНА GOOGLE В ТОТ ДЕНЬ, КОГДА ПОЯВИЛСЯ ВТОРОЙ ЭКРАН. Два экрана
// с одинаковыми ступенями, собранные врозь, расходятся молча: в одном поправят
// отступ или подпись кнопки копирования, во втором — нет, и никто этого не
// заметит, потому что оба по отдельности выглядят правильно. Требование владельца
// того же дня — переиспользовать проверенный блок, а не строить похожий рядом.
//
// 🔒 ЗДЕСЬ ТОЛЬКО ФОРМА, А НЕ СЛОВА. Каждый экран приносит свои строки: общий
// модуль не знает ни одного слова, иначе он стал бы словарём, который тянет в
// браузер строки всех провайдеров сразу.

/** Ступень лестницы: номер в кружке, заголовок и содержимое. */
export function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4" data-step={n}>
      <H3 className="mb-2 flex items-center gap-2" variant="ui">
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
          {n}
        </span>
        {title}
      </H3>
      {children}
    </section>
  )
}

/**
 * Маршрут по чужой панели: пронумерованные точки на горизонтальной линии (265-5).
 *
 * 🔒 ФОРМУ ВЫБРАЛ ВЛАДЕЛЕЦ 2026-09-22: путь по консоли Google длинный, и тринадцать
 * абзацев в карточке не читаются. Линия показывает ДЛИНУ пути сразу, подсказка —
 * одно действие за раз.
 *
 * 🛑 ПОДСКАЗКА ПО НАВЕДЕНИЮ НЕ СУЩЕСТВУЕТ НА ТЕЛЕФОНЕ. Поэтому номер — кнопка:
 * наведение показывает подсказку, нажатие закрепляет тот же текст под линией.
 * Иначе на касании маршрут был бы рядом пустых кружков.
 */
export function RouteLine({ items, hint }: { items: { title: string; text: string }[]; hint: string }) {
  const [picked, setPicked] = useState<number | null>(null)
  const current = picked === null ? null : items[picked]
  return (
    <TooltipProvider delayDuration={100}>
      <div className="mt-3" data-route-line>
        {/* Прокрутка внутри карточки, а не у страницы: на узком экране линия
            длиннее ширины, и страница не должна ехать вбок. */}
        <ol className="flex items-start overflow-x-auto pb-2">
          {items.map((it, i) => (
            <li key={it.title} className="flex shrink-0 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="bare" size="bare"
                    type="button"
                    onClick={() => setPicked(picked === i ? null : i)}
                    aria-pressed={picked === i}
                    aria-label={`${i + 1}. ${it.title}`}
                    className={`inline-flex size-7 items-center justify-center rounded-full border text-xs transition-colors ${
                      picked === i
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-foreground hover:border-primary"
                    }`}
                  >
                    {i + 1}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-64">
                  <span className="block font-medium">{it.title}</span>
                  <span className="block">{it.text}</span>
                </TooltipContent>
              </Tooltip>
              {i < items.length - 1 && <span className="h-px w-5 bg-border sm:w-7" aria-hidden />}
            </li>
          ))}
        </ol>
        {current ? (
          <div className="mt-2 rounded-md border border-border px-3 py-2 text-sm" role="status">
            <span className="block font-medium text-foreground">
              {(picked ?? 0) + 1}. {current.title}
            </span>
            <span className="block text-muted-foreground">{current.text}</span>
          </div>
        ) : (
          <Small className="mt-1 block text-muted-foreground">{hint}</Small>
        )}
      </div>
    </TooltipProvider>
  )
}

/**
 * Карточка-предупреждение о бесплатных лимитах провайдера (265-5, слово владельца
 * 2026-09-22: «максимально компактно»). Одна на оба экрана: цифры у каждого свои
 * и приходят словами, а ссылка ведёт к первоисточнику — цифры чужого тарифа
 * меняются без нашего ведома, и человек обязан уметь проверить их сам.
 */
export function LimitsNote({ title, text, more, href }: { title: string; text: string; more: string; href: string }) {
  return (
    <p
      className="flex gap-2 rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-sm"
      data-limits-note
      role="note"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <span>
        <span className="font-medium text-foreground">{title}</span>{" "}
        <span className="text-muted-foreground">{text}</span>{" "}
        <a href={href} target="_blank" rel="noreferrer noopener" className="whitespace-nowrap underline underline-offset-2">
          {more}
        </a>
      </span>
    </p>
  )
}

/** Маркированный список внутри ступени. */
export function StepPoints({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-foreground text-sm">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}

/** Строка-значение с кнопкой «скопировать». */
export function CopyRow({
  id,
  label,
  value,
  note,
  copy,
  copied,
}: {
  id: string
  label: string
  value: string
  note?: string
  copy: string
  copied: string
}) {
  const [done, setDone] = useState(false)
  return (
    <div className="mt-3 flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input id={id} readOnly value={value} className="font-mono text-xs" />
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value)
              setDone(true)
              window.setTimeout(() => setDone(false), 2000)
            } catch {
              // Копирование запрещено политикой страницы — строка видна и
              // выделяется руками. Молча ничего не происходит, и это законно.
            }
          }}
        >
          {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          <span className="ml-2">{done ? copied : copy}</span>
        </Button>
      </div>
      {note && <Small className="text-muted-foreground">{note}</Small>}
    </div>
  )
}
