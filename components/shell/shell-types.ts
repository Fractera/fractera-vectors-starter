// ОБОЛОЧКА ПРОЕКТА — ШАПКА И ПОДВАЛ, ОДНИ НА ВСЕ СЛУЖБЫ (шаг 285-3).
//
// Слово владельца 2026-09-24: «если мы говорим что мы пере используем один и тот же компонент везде то почему у
// нас корень и ядро имеет правильное представление для хедер и футер … хедер имеет кнопку логин а футер имеет
// серию кнопок включающий в себя специальные режимы переключения языков, изменение ширины экрана изменение
// темы и соцсети».
//
// 🔒 ПАПКА `components/shell/` — ЕДИНСТВЕННЫЙ ИСТОЧНИК ВИДА. Живёт в сайте (элемент root); службы получают её
// копией (`npm run shell-kit:add` в узле), сторож узла сверяет копию с сайтом байт в байт. Руками копию не
// правят. Папка не читает НИ ОДНОГО конфига: всё, что она рисует, приходит объектом `ShellData` — у сайта из
// его настроек (`lib/shell/site-shell-data.ts`), у служб из статической двери сайта `/api/shell/<язык>`.

export type ShellChild = { slug: string; title: string; href?: string }

export type ShellGroup = {
  slug: string
  label: string
  order: number
  childrenAsDropdown: boolean
  roles: string
  children: ShellChild[]
  /** Относительный путь сайта (`/m2m`) или абсолютный адрес — у служб. */
  href?: string
  /** Кнопка без перехода: место зарезервировано, страницы ещё нет. */
  inert?: boolean
}

export type ShellLink = {
  href: string
  label: string
  /** Кому показывать пункт кабинета. Нет поля — всем вошедшим. Вежливость, а не замок. */
  roles?: readonly string[]
}

/** `icon` — ключ каталога значков или адрес загруженной картинки (начинается с `/` или `http`). */
export type ShellSocial = { href: string; label: string; icon: string }

export type ShellLanguage = {
  code: string
  nativeName: string
  englishName: string
  flag: string
  regions: string[]
  regionFlags?: Record<string, string>
}

export type ShellSide = "left" | "right"

export type ShellData = {
  lang: string
  brand: string
  logo: string | null
  /** Корень проекта: `/<язык>` у сайта, абсолютный адрес сайта у служб. */
  home: string
  menuOn: boolean
  top: ShellGroup[]
  footer: ShellGroup[]
  /** Вход включён на сайте — кнопка есть у всех; `null` — нигде. */
  account: null | {
    side: ShellSide
    labels: { signIn: string; account: string; signOut: string }
    links: ShellLink[]
  }
  toggles: { theme: boolean; width: boolean; language: boolean }
  words: {
    menu: string
    footerPages: string
    rights: string
    system: string
    light: string
    dark: string
    social: string
    wide: string
    normal: string
  }
  socials: ShellSocial[]
  address: string | null
  languages: ShellLanguage[]
  regions: string[]
  defaultLang: string
}

/**
 * Что знает только поверхность, на которой нарисована оболочка: свои двери входа. У сайта и ядра это
 * `/api/me`, `/login`, `/logout` (их прокси ведёт на службу входа); у самой службы входа — её собственные.
 */
export type ShellSurface = {
  meUrl?: string
  loginHref?: (lang: string) => string
  logoutHref?: (lang: string) => string
  /** Языки, которые у этой поверхности есть на самом деле; нет — все языки сайта. */
  languages?: string[]
}
