import { AccessGate } from "@/components/auth/access-gate.client"
import { accessGateUi } from "@/components/auth/access-gate.i18n"
import { appDialogUi } from "@/components/dialog/app-dialog.i18n"

// ЗАМОК ВЕТКИ «ПРОТОТИПЫ ДИЗАЙНА» (узел, шаг 711-4): только архитектор — прототипы видят до выбора облика, посетитель — никогда.
// Ветка закрыта от поиска макетом `(protectedLayer)` (robots: noindex).
const ROLES = ["architect"] as const

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return (
    <AccessGate roles={ROLES} lang={lang} ui={accessGateUi(lang)} dialogUi={appDialogUi(lang)}>
      {children}
    </AccessGate>
  )
}
