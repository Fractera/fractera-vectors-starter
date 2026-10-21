import "server-only"
import { getMenuGroups, type MenuGroup } from "@/lib/menu/group-menus"
import { navGroupsFromConfig, defaultFooterGroups } from "@/lib/menu/nav-config"
import { featureOn } from "@/config/platform-config"
import { getAppConfig } from "@/config/app-config"
import { needsPolicyPages } from "@/lib/policy-tools"

// МЕНЮ ПРОЕКТА — ОДНО НА ВСЕ СЛУЖБЫ УЗЛА (шаг 283-1).
//
// Слово владельца 2026-09-24: «на всю глубину проекта все сервисы используют одно и то же меню и сайт и
// авторизация и дата и все те новые которые будут появляться». Меню — настройка САЙТА (элемент root): здесь
// оно собирается ровно так, как его рисует шапка сайта, и этим же отдаётся дверью `/api/menu/<язык>` всем
// остальным службам. Две копии логики разошлись бы в первый же день правки.
//
// 🪦 ЗАГЛУШКИ В КОДЕ УБРАНЫ (шаг 313, 2026-09-26). Здесь Store (277), A2A (277), Nostr и Блог (261-6) дописывались поверх
// меню по слову владельца 2026-09-24 «сохрани кнопки заглушки». Когда владелец завёл те же пункты в конструкторе CONFIG,
// код добавил их второй раз: `slug` не сверялся, и в шапке стало 10 пунктов вместо 6. Выбор владельца 2026-09-26 —
// «Только конструктор»: меню целиком из `nav.top` конструктора, второго источника нет.

/** Верхнее меню так, как его рисует шапка. */
export function resolveTopGroups(lang: string): MenuGroup[] {
  if (!featureOn("topMenu")) return []
  return navGroupsFromConfig("top", lang) ?? getMenuGroups("top", lang)
}

/** Группы подвала так, как их рисует подвал: пусто, пока страницы подвала не включены в панели. */
export function resolveFooterGroups(lang: string): MenuGroup[] {
  // An outside tool (Google Analytics, Search Console) shows the policy pages too (node step 449).
  const pagesOn = featureOn("footerPages") || needsPolicyPages(getAppConfig())
  const fromConfig = pagesOn ? navGroupsFromConfig("footer", lang) : null
  return pagesOn ? (fromConfig ?? [...defaultFooterGroups(lang), ...getMenuGroups("footer", lang)]) : []
}
