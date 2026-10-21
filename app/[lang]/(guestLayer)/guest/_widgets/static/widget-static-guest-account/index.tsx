import { branchRoot } from "@/lib/page-tree"
import { GuestAccountActions, type GuestAccountWords } from "./actions.client"

// ВИДЖЕТ ГОСТЕВОЙ СТРАНИЦЫ (узел, шаг 331-2): слова — поле `account` в `(guestLayer)/guest/_data/<язык>.json`, в коде строк нет.
export function GuestAccount({ lang }: { lang: string }) {
  const root = branchRoot("(guestLayer)", "guest")
  const words = ((root?.overrides[lang] as { account?: GuestAccountWords } | undefined)?.account
    ?? (root?.en as { account?: GuestAccountWords } | undefined)?.account)
  if (!words) return null
  return <GuestAccountActions lang={lang} words={words} />
}
