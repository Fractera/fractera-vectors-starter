// Слова списка прототипов (узел, шаг 711-4).
const EN = {
  empty: "No prototypes yet. They are generated from the core: the element's «Build → Design» tab, «Generate a test page».",
  skill: "Skill",
  from: "From the page",
  home: "home",
  references: "References",
  status: { draft: "Being built", ready: "Ready", pinned: "Pinned", archived: "Archived" },
  open: "Open the prototype",
  preview: "Preview",
}
const RU: typeof EN = {
  empty: "Прототипов пока нет. Их создают из ядра: вкладка элемента «Строительство → Дизайн», «Сгенерировать тестовую страницу».",
  skill: "Навык",
  from: "Со страницы",
  home: "главная",
  references: "Референсы",
  status: { draft: "Строится", ready: "Готов", pinned: "Закреплён", archived: "В архиве" },
  open: "Открыть прототип",
  preview: "Превью",
}
export type PrototypesListWords = typeof EN
export const prototypesListWords = (lang: string): PrototypesListWords => (lang === "ru" ? RU : EN)
