import type { ReactNode } from 'react'
import { GuestAccount } from './static/widget-static-guest-account'

// ВИДЖЕТЫ ЭТОЙ ВЕТКИ (владелец 2026-10-07: «удалили маршрут — проект чистый»). Страница ветки называет виджет в `meta.json` →
// `"widget"`; ищется он только здесь. Удалили ветку — список ушёл вместе с ней.
export const WIDGETS: Record<string, (lang: string) => ReactNode> = {
  // «Вернуться» туда, откуда пришёл, и «Удалить мою учётную запись и покинуть сайт».
  'widget-static-guest-account': (lang) => <GuestAccount lang={lang} />,
}
