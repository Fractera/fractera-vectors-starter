import { ProjectFooter } from "@/components/shell/project-footer";
import { siteShellData } from "@/lib/shell/site-shell-data";

// ПОДВАЛ САЙТА = ПОДВАЛ ПРОЕКТА (285-3). Вид — `components/shell/project-footer.tsx`, одна копия для сайта,
// входа, ядра и каждой новой службы; данные — `siteShellData(lang)`, та же функция, что у двери `/api/shell`.
//
// 🪦 Здесь жил полный подвал со своей историей решений (страницы подвала под выключателем `footerPages`,
// снятые навигатор слоёв и полоса действий, мёртвые выключатели 522, подвал вне переключателя ширины). Все
// ДЕЙСТВУЮЩИЕ правила перенесены в `components/shell/project-footer.tsx` и `lib/shell/site-shell-data.ts`;
// полный прежний текст — `git show v1.6.0:components/menu/footer/footer-menu.server.tsx`.
export function FooterMenu({ lang }: { lang: string }) {
  return <ProjectFooter data={siteShellData(lang)} />;
}
