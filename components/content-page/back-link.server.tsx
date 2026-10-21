import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

// ССЫЛКА «НАЗАД» — ПРИМИТИВ ПОДВАЛА СТРАНИЦЫ (шаг 542).
//
// 🔒 ПОЧЕМУ НЕ ВИД КАТАЛОГА. Это навигация, а не материал: она появляется
// оттого, что у страницы есть уровень выше, и автор не ставит её в список
// блоков. Вид, который нельзя выбрать, врёт о назначении каталога.
//
// 🔒 ПОЧЕМУ ОНА ВСЕГДА ПОСЛЕДНЯЯ. Ниже неё — только подвал сайта. Раздел
// вопросов заканчивает СОДЕРЖИМОЕ, эта полоса заканчивает СТРАНИЦУ; поменяй их
// местами — и последнее, что читает человек, окажется служебной ссылкой.
//
// Знак — из `lucide-react`: своя стрелка контуром была бы ещё одной копией того
// же значка, живущей мимо библиотеки, которая уже стоит в проекте.
//
// Шаг узла 458-11: в той же полосе справа — «вперёд», следующая страница по порядку (владелец 2026-10-12: «мне ещё нужна кнопка
// вперёд в следующей статье по порядку»). Обе ссылки — `Link`: мягкий переход без перезагрузки (навык soft-navigation, 455);
// ✗ до этого «назад» была `<a>`, и переход по ней перезагружал страницу целиком.
export function BackLink({ href, label, next }: { href: string; label?: string; next?: { href: string; label: string; title: string } }) {
  return (
    <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-start sm:justify-between">
      <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary">
        <ArrowLeft size={14} strokeWidth={2.5} aria-hidden />
        {label}
      </Link>
      {next && (
        <Link href={next.href} rel="next" className="group inline-flex max-w-sm flex-col items-end gap-1 self-end text-right sm:self-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {next.label}
            <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
          </span>
          <span className="text-sm font-semibold text-primary group-hover:underline">{next.title}</span>
        </Link>
      )}
    </div>
  )
}
