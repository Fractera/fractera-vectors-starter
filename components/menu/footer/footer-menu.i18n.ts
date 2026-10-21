// Co-located footer translations. These strings BELONG to the footer: they live in the
// footer folder and are imported by nothing else. Delete the footer folder and they go
// with it — zero orphaned data left in the project (co-location rule).
//
// HEADINGS (the two footer-area titles) cover the FULL language catalogue (82, see
// config/translations/language-metadata.ts) — same reach as the rest of the localized
// product. CHROME (copyright + theme labels) stays en/es/ru for now. Any language missing
// from a map falls back to English.

export type FooterLabels = {
  footerPages: string;   // heading over the footer-page navigation (every group on the footer slot)
  pageSections: string;  // heading over the home-page section scroll links (home only)
  rights: string;
  system: string;
  light: string;
  dark: string;
  social: string;        // aria-label/title for the mobile social-links hamburger
};

// The two footer headings — all 82 catalogue languages.
const HEADINGS: Record<string, { footerPages: string; pageSections: string }> = {
  en: { footerPages: "Footer pages", pageSections: "Page sections" },
  ru: { footerPages: "Страницы футера", pageSections: "Разделы страницы" },
};

// Copyright + theme-toggle labels. Kept at en/es/ru (English fallback) — extend as needed.
const CHROME: Record<string, { rights: string; system: string; light: string; dark: string; social: string }> = {
  en: { rights: "All rights reserved.", system: "Theme: system", light: "Theme: light", dark: "Theme: dark", social: "Social links" },
  ru: { rights: "Все права защищены.", system: "Тема: системная", light: "Тема: светлая", dark: "Тема: тёмная", social: "Соцсети" },
};

export function footerLabels(lang: string): FooterLabels {
  const h = HEADINGS[lang] ?? HEADINGS.en;
  const c = CHROME[lang] ?? CHROME.en;
  return { ...h, ...c };
}

// ─── Layers navigator (footer) ───────────────────────────────────────────────
// The four main app areas ("service pages") reached from the footer navigator:
// Home (public) + the role-gated cockpit layers Admin / Design / Projects. Owner-facing
// cockpit navigation → the admin-layers ten (rule 4г: en,es,fr,it,ru,de,pt,pl,tr,nl);
// any other language falls back to English. `denied` is the red toast on insufficient role.
// 🪦 Слова навигатора «слоёв» удалены 2026-08-12 вместе с самим навигатором:
// он вёл на Design :3004 и слой проектов :3003, снесённые шагом 500. Словарь
// без потребителя гниёт молча — следующая сессия принимает его за нужный.

// ─── Ссылка на панель управления (футер) ─────────────────────────────────────
//
// 🔒 ЭТО НАДПИСЬ ДЛЯ ВЛАДЕЛЬЦА, А НЕ ДЛЯ ПОСЕТИТЕЛЯ (владелец 2026-08-14).
// Панель закрыта авторизацией, поэтому ссылку осмысленно читает тот, у кого
// есть доступ, — а он работает в языках кокпита. Отсюда те же десять языков,
// что у соседнего переключателя ширины (правило 4г), с английским запасным.
//
// Это НЕ воскрешение снесённого «навигатора слоёв»: тот вёл на Design :3004 и
// слой проектов :3003, которых больше нет, и был удалён именно за ссылки в
// никуда. Здесь одна ссылка на одну живую службу.
export type AdminLinkLabels = { admin: string };

const ADMIN_LINK: Record<string, AdminLinkLabels> = {
  en: { admin: "Control panel" },
  ru: { admin: "Панель управления" },
};

export function adminLinkLabels(lang: string): AdminLinkLabels {
  return ADMIN_LINK[lang] ?? ADMIN_LINK.en;
}

// ─── Architect layer (footer) ────────────────────────────────────────────────
//
// Подпись входа в слой архитектора — страницу настроек проекта ВНУТРИ самого
// проекта (шаг 31-1, решение владельца 2026-08-28).
//
// 🔒 СЛОВО НЕ ПОВТОРЯЕТ СОСЕДА. Рядом стоит «Панель управления» — чужой
// поддомен, где живёт платформа. Здесь настройки самого проекта, и назвать это
// вторыми «настройками» значило бы поставить в один ряд две кнопки, между
// которыми человек выбирает наугад.
//
// 🔒 ЯЗЫКОВ ДВА, И ЭТО НАЗВАНО ЧЕСТНО. Владелец 2026-08-28: «en + ru сейчас,
// остальные файлом позже» — набор строк слоя ещё меняется каждый подшаг, и
// переводить его сейчас значит переводить дважды. Резолвер откатывается на
// английский, поэтому остальные языки видят рабочую кнопку, а не пустоту.
export type ArchitectLinkUi = { footer: string };

const ARCHITECT_LINK: Record<string, ArchitectLinkUi> = {
  en: { footer: "Project settings" },
  ru: { footer: "Настройки проекта" },
};

export function architectLinkUi(lang: string): ArchitectLinkUi {
  return ARCHITECT_LINK[lang] ?? ARCHITECT_LINK.en;
}

// ─── Design layer (footer) ───────────────────────────────────────────────────
//
// 🔒 ОТДЕЛЬНЫЙ ВХОД, А НЕ РАЗДЕЛ ВНУТРИ НАСТРОЕК — указание владельца 2026-08-29,
// отменившее моё решение того же дня: «я хотел, чтобы здесь была ещё одна кнопка,
// которая называется дизайн… чтобы они не были в одной огромной вкладке настройки
// проекта, которая уже сильно перегружена».
//
// 🔒 СЛОВО КОРОТКОЕ И НЕ ПОВТОРЯЕТ СОСЕДЕЙ. В ряду уже стоят «Настройки проекта» и
// «Панель управления»; третья кнопка со словом «настройки» сделала бы выбор между
// ними угадыванием.
export type DesignLinkUi = { footer: string };

const DESIGN_LINK: Record<string, DesignLinkUi> = {
  en: { footer: "Design" },
  ru: { footer: "Дизайн" },
};

export function designLinkUi(lang: string): DesignLinkUi {
  return DESIGN_LINK[lang] ?? DESIGN_LINK.en;
}

// ─── Dev-mode entry (footer) ────────────────────────────────────────────────
//
// 🔒 ТРЕТИЙ ВХОД СЛОЯ (владелец 2026-08-31), и заведён он по тому же доводу, что
// «Дизайн» до него: вкладка настроек проекта несла девять групп, из которых
// режим разработки не был настройкой вовсе — он решает, КАК с проектом работает
// агент. «Главное освободить основную вкладку от избыточных и не связанных
// инструментов».
//
// 🔒 СЛОВО ТО ЖЕ, ЧТО В МЕНЮ И В ЗАГОЛОВКЕ СТРАНИЦЫ. Вход, названный иначе, чем
// место, куда он ведёт, заставляет человека проверять догадку нажатием.
export type DevModeLinkUi = { footer: string };

const DEV_MODE_LINK: Record<string, DevModeLinkUi> = {
  en: { footer: "Development mode" },
  ru: { footer: "Режим разработки" },
};

export function devModeLinkUi(lang: string): DevModeLinkUi {
  return DEV_MODE_LINK[lang] ?? DEV_MODE_LINK.en;
}

// ─── Telegram bot (footer) ──────────────────────────────────────────────────
//
// 🔒 ЧЕТВЁРТЫЙ ВХОД СЛОЯ (владелец 2026-08-31, дословно: «я хочу, чтоб мы создали
// Telegram-бот внутри footer»). Довод тот же, что у дизайна и режима разработки:
// у бота свои три раздела, и вложить их в настройки проекта значило бы удлинить
// меню, из которого каждый раз выбирают одну строку.
//
// 🔒 СЛОВО ТО ЖЕ, ЧТО В МЕНЮ И В ЗАГОЛОВКЕ СТРАНИЦЫ. Вход, названный иначе, чем
// место, куда он ведёт, заставляет человека проверять догадку нажатием.
export type TelegramLinkUi = { footer: string };

const TELEGRAM_LINK: Record<string, TelegramLinkUi> = {
  en: { footer: "Telegram bot" },
  ru: { footer: "Telegram-бот" },
};

export function telegramLinkUi(lang: string): TelegramLinkUi {
  return TELEGRAM_LINK[lang] ?? TELEGRAM_LINK.en;
}

// ─── Sign-in (footer) ───────────────────────────────────────────────────────
//
// 🔒 ПЯТЫЙ ВХОД СЛОЯ (владелец 2026-08-31): «сюда из административной панели мы
// вытащим настройку авторизации». Довод тот же, что у трёх предыдущих входов: у
// авторизации свои разделы — описание и два провайдера, — и вложить их в
// настройки проекта значило бы удлинить меню, из которого выбирают одну строку.
//
// 🔒 СЛОВО ТО ЖЕ, ЧТО В МЕНЮ И В ЗАГОЛОВКЕ СТРАНИЦЫ. Вход, названный иначе, чем
// место, куда он ведёт, заставляет человека проверять догадку нажатием.
export type AuthLinkUi = { footer: string };

const AUTH_LINK: Record<string, AuthLinkUi> = {
  en: { footer: "Sign-in" },
  ru: { footer: "Авторизация" },
};

export function authLinkUi(lang: string): AuthLinkUi {
  return AUTH_LINK[lang] ?? AUTH_LINK.en;
}

// ─── Architect group heading (footer) ───────────────────────────────────────
//
// 🔒 ПОДПИСЬ ГРУППЫ, А НЕ ЕЩЁ ОДНА ССЫЛКА (владелец 2026-08-29). Четыре
// служебные ссылки, отделённые линией и не подписанные, читаются как забытая
// владельцем настройка подвала: линия говорит «это другое», но не говорит «другое
// ЧТО».
//
// 🔒 СЛОВО НАЗЫВАЕТ АДРЕСАТА, А НЕ СОДЕРЖИМОЕ. «Служебные ссылки» описывало бы
// нас, а не человека; «страницы архитектора» отвечает на вопрос «кому это»,
// который у посетителя возникает первым.
export type ArchitectGroupUi = { title: string };

const ARCHITECT_GROUP: Record<string, ArchitectGroupUi> = {
  en: { title: "Architect pages" },
  ru: { title: "Страницы архитектора" },
};

export function architectGroupUi(lang: string): ArchitectGroupUi {
  return ARCHITECT_GROUP[lang] ?? ARCHITECT_GROUP.en;
}

// ─── Content-width toggle (footer) ───────────────────────────────────────────
// aria-label/title for the wide/narrow screen-width button (ported from the Projects
// zone). Admin-layers ten (rule 4г); English fallback for any other language.
export type WidthLabels = { wide: string; normal: string };

const WIDTH_LABELS: Record<string, WidthLabels> = {
  en: { wide: "Widen the screen", normal: "Narrow the screen" },
  ru: { wide: "Шире экран", normal: "Уже экран" },
};

export function widthLabels(lang: string): WidthLabels {
  return WIDTH_LABELS[lang] ?? WIDTH_LABELS.en;
}

// 🪦 СЛОВАРЬ «ЧАТ С ИИ-АГЕНТОМ» УБРАН 2026-09-05 (ревизия, шаг 116) вместе с самой
// кнопкой подвала — прямым словом владельца: «из подвала также убирай ссылку на чат».
// Стратегия одновременной работы библиотеки чата и Telegram прекращена.
