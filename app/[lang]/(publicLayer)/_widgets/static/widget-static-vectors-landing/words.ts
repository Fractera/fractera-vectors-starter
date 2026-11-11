import { branchRoot } from "@/lib/page-tree"
import type { PageItem } from "@/lib/content/page-items"

// Слова лендинга векторного хранилища — части главной (`(publicLayer)/_data/<язык>.json`). Страница `bare` (шаг 423): её части рисует этот виджет,
// они же — текстовая копия страницы для поиска и агентов (`index.md`, `llms-full.txt`). Язык без своего файла получает английский, как
// вся страница. Слов в коде нет: правка абзаца видна без пересборки (ISR 300 с или `npm run pages:refresh`).
export function landingBlocks(lang: string): PageItem[] {
  const root = branchRoot("(publicLayer)")
  return (root?.overrides[lang]?.body ?? root?.en.body ?? []) as PageItem[]
}

export type Hero = Extract<PageItem, { kind: "section-hero-centered" }>
export type Section = { id: string; title: string; body: PageItem[] }

/** Первый экран и разделы: раздел — `section-head` и части до следующего; виджеты последовательности пропускаются. */
export function landing(lang: string): { hero: Hero | null; sections: Section[] } {
  let hero: Hero | null = null
  const sections: Section[] = []
  for (const b of landingBlocks(lang)) {
    if (b.kind === "section-hero-centered") hero = b
    else if (b.kind === "section-head") sections.push({ id: b.id, title: b.title, body: [] })
    else if (!b.kind.startsWith("widget-")) sections.at(-1)?.body.push(b)
  }
  return { hero, sections }
}
