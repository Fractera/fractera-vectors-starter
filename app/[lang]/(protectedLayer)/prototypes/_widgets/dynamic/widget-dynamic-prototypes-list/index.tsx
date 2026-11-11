import Link from "next/link"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { buttonVariants } from "@/components/ui/button"
import { listPrototypes, prototypeDir } from "@/lib/prototypes"
import { prototypesListWords } from "./words.i18n"

// Список прототипов дизайна элемента (узел, шаг 711-4): каждый — навык, исходная страница, референсы, статус и ссылка. Читается во
// время работы: новый прототип появляется без пересборки.
// 715 (владелец 2026-11-10): «Открыть прототип» — настоящая кнопка, а справа — маленькое превью (снимок прототипа для компьютера через
// дверь `/api/prototypes/<id>/shot`); снимка ещё нет — превью не рисуется, карточка остаётся текстом с кнопкой.
const hasShot = (id: string) => { const dir = prototypeDir(id); return !!dir && existsSync(join(dir, "shots", "desktop.png")) }
export function Widget({ lang }: { lang: string }) {
  const w = prototypesListWords(lang)
  const all = listPrototypes()
  if (all.length === 0) return <p data-block="pl4a1" className="my-4 text-[length:var(--fs-small)] text-muted-foreground">{w.empty}</p>
  return (
    <ul data-block="pl4a2" className="my-4 flex flex-col gap-3">
      {all.map((p) => (
        <li key={p.id} data-block="pl4a3" data-prototype-item={p.id} data-status={p.status} className="flex items-start gap-4 rounded-lg border border-border p-4">
          <div data-block="pl4a8" className="min-w-0 flex-1">
          <p data-block="pl4a4" className="text-[length:var(--fs-body)] font-medium text-foreground">{p.title ?? p.id}</p>
          <p data-block="pl4a5" className="mt-1 text-[length:var(--fs-small)] text-muted-foreground">
            {w.skill}: {p.skill} · {w.from}: {p.from === "home" ? w.home : p.from} · {w.status[p.status]}
          </p>
          {p.references.length > 0 && (
            <p data-block="pl4a6" className="mt-1 text-[length:var(--fs-small)] text-muted-foreground">{w.references}: {p.references.length}</p>
          )}
          {p.status !== "archived" && (
            <Link data-block="pl4a7" href={`/${lang}/prototypes/${p.id}`} className={buttonVariants({ size: "sm", className: "mt-3" })}>{w.open}</Link>
          )}
          </div>
          {hasShot(p.id) && (
            <Link data-block="pl4a9" href={`/${lang}/prototypes/${p.id}`} aria-label={`${w.preview}: ${p.title ?? p.id}`}
              className="block w-28 shrink-0 overflow-hidden rounded-md border border-border sm:w-40">
              {/* eslint-disable-next-line @next/next/no-img-element -- снимок отдаёт закрытая дверь, оптимизатору картинок он недоступен */}
              <img src={`/api/prototypes/${p.id}/shot?kind=desktop`} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover object-top" />
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}
