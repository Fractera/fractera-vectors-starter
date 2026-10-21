import type { ReactNode } from 'react'
import { PolicyAnalytics } from './static/widget-static-policy-analytics'
import { ReferenceTitle } from './static/widget-static-reference-title'

// ВИДЖЕТЫ ЭТОЙ ВЕТКИ (владелец 2026-10-07: «удалили маршрут — проект чистый»). Страница ветки называет виджет в `meta.json` →
// `"widget"`; ищется он только здесь. Удалили ветку — список ушёл вместе с ней.
export const WIDGETS: Record<string, (lang: string) => ReactNode> = {
  // Policy pages — the Google Analytics section, only while it is on (node step 449-2).
  'widget-static-policy-analytics': (lang) => <PolicyAnalytics lang={lang} />,
  // Главная эталонного стартового шаблона — одна надпись по центру (узел, шаг 542).
  'widget-static-reference-title': (lang) => <ReferenceTitle lang={lang} />,
}
