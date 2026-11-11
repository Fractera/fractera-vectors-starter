"use client"

import { Button } from "@/components/ui/button"

// ОДНО ПОЛЕ ИЗ СТУПЕНЕЙ (711-7): тень карточек, скорость интерфейса, толщина заголовков. Ступени, а не свободное значение — так же,
// как скругление и плотность рядом: свободная строка тени или длительности была бы способом сломать страницу. Адреса `data-block`
// приходят от поля, которое ставит компонент, — у каждого места свои.
export type PresetBids = { section: string; label: string; hint: string; list: string }

export function PresetField<V extends string | number>({ field, bids, label, hint, options, value, onChange }: {
  field: string
  bids: PresetBids
  label: string
  hint: string
  options: { value: V; label: string }[]
  value: V | undefined
  onChange: (value: V) => void
}) {
  return (
    <section data-block={bids.section} data-design-field={field} className="rounded-lg border border-border p-4">
      <p data-block={bids.label} className="text-[length:var(--fs-body)] font-medium text-foreground">{label}</p>
      <p data-block={bids.hint} className="mt-1 text-[length:var(--fs-small)] leading-relaxed text-muted-foreground">{hint}</p>
      <div data-block={bids.list} className="mt-3 flex flex-col gap-1.5">
        {options.map((o) => (
          <Button variant="outline"
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={
              "h-auto justify-start whitespace-normal font-normal w-full rounded-md border px-3 py-2 text-left text-[length:var(--fs-small)] transition-colors " +
              (value === o.value ? "border-primary/50 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-muted/50")
            }
          >
            {o.label}
          </Button>
        ))}
      </div>
    </section>
  )
}
