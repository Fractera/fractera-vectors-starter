import Link from 'next/link'
import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { branchChild, branchDir, wordsIn, type TreePage } from '@/lib/page-tree'

// РАЗДЕЛЫ СТРАНИЦЫ АРХИТЕКТОРА (шаг 579-2). Своя мастерская оформления (`admin/design/*`) и свои настройки сайта
// (`admin/site-settings/*`) — по странице на раздел (закон 236), а меню элемента вложенных страниц не показывает. Ряд ссылок
// над редактором ведёт между разделами одной страницы.
// 🔒 СПИСОК РАЗДЕЛОВ НЕ ПИШЕТСЯ ВТОРОЙ РАЗ: это папки `_pages/<страница>/<раздел>/` по `meta.order`, подписи — их `title`
// (тот же закон, что у оглавления из `h2`). Добавили папку — ссылка появилась; удалили — исчезла.
const SEGMENTS = ['(protectedLayer)', 'admin']

function sectionsOf(page: string): TreePage[] {
  const dir = join(branchDir(...SEGMENTS), '_pages', page)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((n) => statSync(join(dir, n)).isDirectory())
    .map((n) => branchChild(SEGMENTS, `${page}/${n}`))
    .filter((p): p is TreePage => p !== null)
    .sort((a, b) => (a.meta.order ?? 1e9) - (b.meta.order ?? 1e9) || a.slug.localeCompare(b.slug))
}

export function SectionTabs({ lang, page, current }: { lang: string; page: string; current: string }) {
  const parent = branchChild(SEGMENTS, page)
  if (!parent) return null
  const items = [
    { href: `/${lang}/admin/${page}`, title: wordsIn(parent, lang).title, on: current === '' },
    ...sectionsOf(page).map((p) => ({ href: `/${lang}/admin/${p.slug}`, title: wordsIn(p, lang).title, on: p.slug === `${page}/${current}` })),
  ]
  // 581: сверху — линия шапки страницы, снизу — своя; кнопка отстоит от обеих одинаково (`pt-3` = `pb-3`). Владелец 2026-10-24:
  // выделенная кнопка касалась верхнего разделителя.
  return (
    <nav data-block="n6kce" aria-label={wordsIn(parent, lang).title} className="mb-6 flex flex-wrap gap-2 border-b border-border pt-3 pb-3">
      {items.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-current={s.on ? 'page' : undefined}
          className={s.on
            ? 'rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground'
            : 'rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground'}
        >
          {s.title}
        </Link>
      ))}
    </nav>
  )
}
