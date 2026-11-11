import type { ReactNode } from 'react'
import { UsersTable } from './dynamic/widget-dynamic-users-table/index.client'
import { usersTableUi } from './dynamic/widget-dynamic-users-table/ui.i18n'
import { SiteSettings } from './dynamic/widget-dynamic-site-settings'

// ВИДЖЕТЫ ЭТОЙ ВЕТКИ (владелец 2026-10-07: «удалили маршрут — проект чистый»). Страница ветки называет виджет в `meta.json` →
// `"widget"`; ищется он только здесь. Удалили ветку — список ушёл вместе с ней.
export const WIDGETS: Record<string, (lang: string) => ReactNode> = {
  'widget-dynamic-users-table': (lang) => <UsersTable lang={lang} ui={usersTableUi(lang)} />,
  // Свои настройки элемента — копия редактора CONFIG (`_pages/site-settings`).
  'widget-dynamic-site-settings': (lang) => <SiteSettings lang={lang} />,
}
