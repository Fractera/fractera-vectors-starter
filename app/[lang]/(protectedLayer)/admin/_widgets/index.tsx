import type { ReactNode } from 'react'
import { UsersTable } from './dynamic/widget-dynamic-users-table/index.client'
import { usersTableUi } from './dynamic/widget-dynamic-users-table/ui.i18n'
import { SiteSettings } from './dynamic/widget-dynamic-site-settings'
import { Widget as DesignBrief } from './dynamic/widget-dynamic-design-brief'
import { Widget as DesignOverview } from './dynamic/widget-dynamic-design-overview'
import { Widget as DesignColors } from './dynamic/widget-dynamic-design-colors'
import { Widget as DesignType } from './dynamic/widget-dynamic-design-type'
import { Widget as DesignShape } from './dynamic/widget-dynamic-design-shape'

// ВИДЖЕТЫ ЭТОЙ ВЕТКИ (владелец 2026-10-07: «удалили маршрут — проект чистый»). Страница ветки называет виджет в `meta.json` →
// `"widget"`; ищется он только здесь. Удалили ветку — список ушёл вместе с ней.
export const WIDGETS: Record<string, (lang: string) => ReactNode> = {
  'widget-dynamic-users-table': (lang) => <UsersTable lang={lang} ui={usersTableUi(lang)} />,
  // 579-1: своя мастерская оформления (`_pages/design`) — редакторы «Дизайна» над DESIGN-CONFIG этого элемента.
  // 706-4: бриф дизайна — первым на странице «Дизайн». 717-9d: и у нативного элемента (владелец 2026-11-11: «до 717-11»).
  'widget-dynamic-design-brief': (lang) => <DesignBrief lang={lang} />,
  'widget-dynamic-design-overview': (lang) => <DesignOverview lang={lang} />,
  'widget-dynamic-design-colors': (lang) => <DesignColors lang={lang} />,
  'widget-dynamic-design-type': (lang) => <DesignType lang={lang} />,
  'widget-dynamic-design-shape': (lang) => <DesignShape lang={lang} />,
  // Свои настройки элемента — копия редактора CONFIG (`_pages/site-settings`).
  'widget-dynamic-site-settings': (lang) => <SiteSettings lang={lang} />,
}
