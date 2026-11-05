import { branchRoot } from "@/lib/page-tree"
import type { Block } from "@/lib/content/blocks/types"

// Слова лендинга векторного хранилища — блоки главной (`(publicLayer)/_data/<язык>.json`). Страница `bare` (шаг 423): её блоки рисует этот виджет,
// они же — текстовая копия страницы для поиска и агентов (`index.md`, `llms-full.txt`). Язык без своего файла получает английский, как
// вся страница. Слов в коде нет: правка абзаца видна без пересборки (ISR 300 с или `npm run pages:refresh`).
export function landingBlocks(lang: string): Block[] {
  const root = branchRoot("(publicLayer)")
  return (root?.overrides[lang]?.blocks ?? root?.en.blocks ?? []) as Block[]
}

export type Hero = Extract<Block, { kind: "block-hero-centered" }>
export type Section = { id: string; title: string; blocks: Block[] }

/** Первый экран и разделы: раздел — `block-section-head` и блоки до следующего; виджеты последовательности пропускаются. */
export function landing(lang: string): { hero: Hero | null; sections: Section[] } {
  let hero: Hero | null = null
  const sections: Section[] = []
  for (const b of landingBlocks(lang)) {
    if (b.kind === "block-hero-centered") hero = b
    else if (b.kind === "block-section-head") sections.push({ id: b.id, title: b.title, blocks: [] })
    else if (!b.kind.startsWith("widget-")) sections.at(-1)?.blocks.push(b)
  }
  return { hero, sections }
}
