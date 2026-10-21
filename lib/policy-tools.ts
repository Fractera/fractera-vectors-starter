// Outside tools that change what a visitor must be told (node step 449, owner 2026-10-11: «навыки должны автоматически
// активировать куки баннер ну и скорее всего подвал в котором он должны появиться страницы … их стоит отрисовать каждый раз как
// только появляется инструменты которые требуют соответствующие настройки»).
//
// One answer for every place that asks: the layout (cookie banner), the footer (policy pages) and the policy pages themselves
// (the Google Analytics section). A tool is on when its setting in APP-CONFIG is filled — the switches in PLATFORM-CONFIG can
// only add, never hide what a tool needs.

import type { AppConfig } from "@/config/app-config.defaults"

export type PolicyTools = { googleAnalytics: boolean; searchConsole: boolean }

export function policyTools(cfg: AppConfig): PolicyTools {
  return {
    googleAnalytics: Boolean(cfg.analytics?.enabled && cfg.analytics.googleAnalyticsId),
    searchConsole: Boolean(cfg.seo?.googleVerification),
  }
}

/** Google Analytics sets cookies, so the visitor is asked first. Search Console sets none — it is a meta tag. */
export function needsCookieBanner(cfg: AppConfig): boolean {
  return policyTools(cfg).googleAnalytics
}

/** Any outside tool on → the footer with the policy pages is shown, so the visitor can read what is collected. */
export function needsPolicyPages(cfg: AppConfig): boolean {
  const t = policyTools(cfg)
  return t.googleAnalytics || t.searchConsole
}
