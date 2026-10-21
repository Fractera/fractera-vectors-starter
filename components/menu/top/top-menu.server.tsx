import { slotHasGroups } from "@/lib/menu/group-menus";
import { DrawerToggle } from "@/components/menu/shared/drawer-toggle.client";
import { topMenuUi } from "@/components/menu/top/top-menu.i18n";
import { ProjectHeader } from "@/components/shell/project-header";
import { siteShellData } from "@/lib/shell/site-shell-data";

// ШАПКА САЙТА = ШАПКА ПРОЕКТА (285-3). Вид живёт в `components/shell/` — одна копия для сайта, входа, ядра и
// каждой новой службы; сюда остаётся только то, что есть у одного сайта: кнопки ящиков слева/справа.
// Данные — `siteShellData(lang)`, та же функция, что отдаёт статическая дверь `/api/shell/<язык>`.
export async function TopMenu({ lang }: { lang: string }) {
  const ui = topMenuUi(lang);
  const leftHas = slotHasGroups("left", lang);
  const rightHas = slotHasGroups("right", lang);
  return (
    <ProjectHeader
      data={siteShellData(lang)}
      leftSlot={leftHas ? <DrawerToggle side="left" labels={{ open: ui.openLeft, close: ui.closeLeft }} /> : undefined}
      rightSlot={rightHas ? <DrawerToggle side="right" labels={{ open: ui.openRight, close: ui.closeRight }} /> : undefined}
    />
  );
}
