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
// 662-5 (владелец 2026-11-06: «построить верхнее меню такой же как на странице архитектора в которой состоит из двух разделов нативные
// элементы и кастомные элементы»): две вкладки, как островок ядра — нативные, затем кастомные; пустая вкладка не рисуется.
export function catalogGroups(lang: string): ShellGroup[] {
  const entries = projectCatalog(lang)
  const ui = topMenuUi(lang)
  const child = (e: (typeof entries)[number]) => ({
    slug: e.id,
    title: e.title,
    href: e.href as string,
    ...(e.description ? { description: e.description } : {}),
    // 662-1 (выбор владельца «Метка + включение»): выключенный — с меткой, к своему включателю в ядре, только архитектору.
    ...(e.off ? { roles: "architect", ...(e.mark ? { mark: e.mark } : {}) } : {}),
  })
  const groups: ShellGroup[] = []
  for (const [kind, slug, label, order] of [["native", "native-elements", ui.nativeElements, -2], ["custom", "custom-elements", ui.customElements, -1]] as const) {
    const list = entries.filter((e) => e.kind === kind)
    if (list.length) groups.push({ slug, label, order, childrenAsDropdown: true, roles: "public", catalog: true, children: list.map(child) })
  }
  return groups
}
