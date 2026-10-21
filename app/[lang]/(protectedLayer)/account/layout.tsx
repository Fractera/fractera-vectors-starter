import { AccessGate } from "@/components/auth/access-gate.client"
import { PROTECTED_GROUP_ROLES } from "@/lib/roles"
import { accessGateUi } from "@/components/auth/access-gate.i18n"
import { appDialogUi } from "@/components/dialog/app-dialog.i18n"
import { accountLabels } from "@/components/menu/account/account-menu.i18n"
import { FlowRail } from "../_components/flow-rail.server"

// Замок ветки «account»: пускает роли категории (lib/roles.ts → PROTECTED_GROUP_ROLES.account). Ребёнок сужает доступ ролями
// из своего meta.json — второй замок ставит ./[slug] (lib/branch-page.tsx).
export default async function Layout(
  { children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> },
) {
  const { lang } = await params
  return (
    <AccessGate roles={PROTECTED_GROUP_ROLES.account} lang={lang} ui={accessGateUi(lang)} dialogUi={appDialogUi(lang)}>
      <FlowRail group="account" label={accountLabels(lang).groupAccount} />
      {children}
    </AccessGate>
  )
}
