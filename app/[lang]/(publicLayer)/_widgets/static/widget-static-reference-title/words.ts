import { branchRoot } from "@/lib/page-tree"

// Надпись главной эталонного шаблона — заголовок данных главной (`(publicLayer)/_data/<язык>.json` → `title`). Слов в коде нет:
// язык без своего файла получает английский, как вся страница.
export function referenceTitle(lang: string): string {
  const root = branchRoot("(publicLayer)")
  const words = { ...(root?.en as { title?: string } | undefined), ...(root?.overrides[lang] as { title?: string } | undefined) }
  return words.title ?? ""
}
