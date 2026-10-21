import type { Metadata } from "next"
import { GuestGate } from "../_components/guest-gate.client"
import { branchRoot, wordsIn } from "@/lib/page-tree"

// Замок гостевой ветки: нет сессии → служба входа создаёт гостя и возвращает сюда (одна попытка на вкладку).
// Слова замка — поле `gate` в ./_data/<язык>.json. Закрыта от поиска: у каждого своя сессия.
export const metadata: Metadata = { robots: { index: false, follow: false } }

type GateWords = { signingIn: string; failed: string }

export default async function Layout(
  { children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> },
) {
  const { lang } = await params
  const root = branchRoot("(guestLayer)", "guest")
  const gate = ((root?.overrides[lang] as { gate?: GateWords } | undefined)?.gate ?? (root?.en as { gate?: GateWords } | undefined)?.gate) ?? { signingIn: "", failed: "" }
  void wordsIn
  return <GuestGate signingIn={gate.signingIn} failed={gate.failed}>{children}</GuestGate>
}
