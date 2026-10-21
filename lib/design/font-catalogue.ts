// 🔒 КАТАЛОГ ПЕРЕЕХАЛ ИЗ ПАНЕЛИ В ПРОЕКТ ДОСЛОВНО (39-2, 2026-08-29). Ни одна
// запись не изменена: это ДАННЫЕ о шрифтах, а не поверхность панели, и переписать
// их при переносе значило бы завести второй, расходящийся каталог. Оригинал
// (`bridges/app/lib/design/font-catalogue.ts`) уходит вместе с группой «Дизайн» в
// подшаге 39-6 — двух копий не останется.

// КАТАЛОГ ШРИФТОВ — откуда они берутся, где живут и как подключаются.
//
// 🔒 ПОЧЕМУ СПИСОК, А НЕ ПОЛЕ ВВОДА. Имя шрифта, набранное руками, ломается
// тремя способами сразу, и все три тихие: опечатка («Playfair Dispaly») даёт
// молчаливый откат на системный шрифт; шрифт без кириллицы превращает русскую
// страницу в набор прямоугольников; адрес подключения, забытый рядом с именем,
// оставляет `font-family` без самого файла. Список снимает все три: у каждой
// записи есть проверенный адрес и честно указанные алфавиты.
//
// 🔒 ОТКУДА ФАЙЛЫ (шаг 315, 2026-09-26). Семейства — с Google Fonts (`fonts.google.com`), все под свободной
// лицензией OFL или Apache, но файлы отдаёт САМ УЗЕЛ: пакеты `@fontsource*` ставятся вместе со службой, скрипт
// `scripts/local-fonts.mjs` кладёт их в `public/fonts/` перед сборкой, `import` записи — адрес на своём сервере.
// Прежде шрифт приезжал с раздачи Google, и без интернета страница рисовалась системным шрифтом — слово
// владельца: «critical error». Заодно адрес посетителя больше не уходит Google (GDPR, LG München I, 3 O 17493/20).
// Таблица файлов — `lib/design/local-fonts.json`; семейство здесь и там обязано совпадать буквально.

export type FontAlphabet = "latin" | "cyrillic" | "greek" | "arabic" | "cjk";

export type FontEntry = {
  /** Имя семейства — уезжает в `font-family` как есть. */
  family: string;
  /** Адрес таблицы стилей на своём сервере (`/fonts/<slug>.css`). Пусто = системный шрифт, ничего не загружается. */
  import?: string;
  /** Какие алфавиты покрывает. */
  alphabets: FontAlphabet[];
  /** Характер: для чего этот шрифт уместен. */
  kind: "sans" | "serif" | "mono";
};

/**
 * 🔒 СИСТЕМНЫЙ НАБОР — ПЕРВЫЙ И БЕЗ ЗАГРУЗКИ. Он берёт шрифт, уже стоящий на
 * устройстве: ничего не скачивается, ничего не уходит наружу, текст виден в
 * первый же кадр. Для большинства проектов это лучший выбор, и он обязан стоять
 * первым — иначе список читается как «выберите, чем нагрузить страницу».
 */
export const SYSTEM_STACK: Record<FontEntry["kind"], string> = {
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const local = (slug: string) => `/fonts/${slug}.css`;

export const FONT_CATALOGUE: FontEntry[] = [
  // ── Без загрузки ───────────────────────────────────────────────────────────
  { family: SYSTEM_STACK.sans, alphabets: ["latin", "cyrillic", "greek"], kind: "sans" },
  { family: SYSTEM_STACK.serif, alphabets: ["latin", "cyrillic", "greek"], kind: "serif" },
  { family: SYSTEM_STACK.mono, alphabets: ["latin", "cyrillic"], kind: "mono" },

  // ── Без засечек ────────────────────────────────────────────────────────────
  { family: "Inter", import: local("inter"), alphabets: ["latin", "cyrillic", "greek"], kind: "sans" },
  { family: "Manrope", import: local("manrope"), alphabets: ["latin", "cyrillic", "greek"], kind: "sans" },
  { family: "Montserrat", import: local("montserrat"), alphabets: ["latin", "cyrillic"], kind: "sans" },
  { family: "Rubik", import: local("rubik"), alphabets: ["latin", "cyrillic", "arabic"], kind: "sans" },
  { family: "Noto Sans", import: local("noto-sans"), alphabets: ["latin", "cyrillic", "greek"], kind: "sans" },

  // ── С засечками ────────────────────────────────────────────────────────────
  { family: "Playfair Display", import: local("playfair-display"), alphabets: ["latin", "cyrillic"], kind: "serif" },
  { family: "Merriweather", import: local("merriweather"), alphabets: ["latin", "cyrillic"], kind: "serif" },
  { family: "Lora", import: local("lora"), alphabets: ["latin", "cyrillic"], kind: "serif" },
  { family: "Source Serif 4", import: local("source-serif-4"), alphabets: ["latin", "cyrillic", "greek"], kind: "serif" },

  // ── Моноширинные ───────────────────────────────────────────────────────────
  { family: "JetBrains Mono", import: local("jetbrains-mono"), alphabets: ["latin", "cyrillic", "greek"], kind: "mono" },
  { family: "IBM Plex Mono", import: local("ibm-plex-mono"), alphabets: ["latin", "cyrillic"], kind: "mono" },
];

/** Системный ли это вариант — то есть без загрузки и без обращения наружу. */
export function isSystemFont(family: string): boolean {
  return Object.values(SYSTEM_STACK).includes(family);
}
