import "server-only"
import { projectCatalog } from "@/lib/project-settings"
import { topMenuUi } from "@/components/menu/top/top-menu.i18n"
import type { ShellGroup } from "@/components/shell/shell-types"

// ВКЛАДКА «ВСЕ ПРОЕКТЫ» — ПЕРВАЯ В ШАПКЕ ЭЛЕМЕНТА, ПОДКЛЮЧЁННОГО К CONFIG (узел, шаг 553).
//
// 🎯 Слово владельца 2026-10-21: «шапка будет иметь как минимум одну первую автоматизированы вкладку которая будет создавать
// перечисление всех элементов и ссылки на их главные страницы». Карточки — главные страницы элементов узла (заголовок, описание,
// адрес); список считает ядро и раздаёт CONFIG (`lib/project-settings.ts`, `projectCatalog`). Руками вкладку не делают и не убирают:
// она не выключается переключателем верхнего меню и пропадает только вместе с каталогом или связью с CONFIG.
export function catalogGroup(lang: string): ShellGroup | null {
  const entries = projectCatalog(lang)
  if (entries.length === 0) return null
  return {
    slug: "all-projects",
    label: topMenuUi(lang).allProjects,
    order: -1,
    childrenAsDropdown: true,
    roles: "public",
    catalog: true,
    children: entries.map((e) => ({ slug: e.id, title: e.title, href: e.href as string, ...(e.description ? { description: e.description } : {}) })),
  }
}
