// Адрес пункта меню: абсолютный — как есть (у служб все адреса ведут на сайт), относительный — с языком.
// ✗ оплачено 280-3: дописанный к абсолютному адресу язык дал `/ru/ru/site` и 404.
// ✗ оплачено 333-23: адреса в настройках меню уже несут язык (`/ru/chain`), и дописанный второй раз язык дал
// `/ru/ru/chain` и 404 у всех относительных пунктов шапки и подвала. Язык в начале адреса заменяется языком страницы.
const LEADING_LANG = /^\/[a-z]{2}(?=\/|#|\?|$)/

export function shellHref(lang: string, href: string | undefined, fallbackPath: string): string {
  if (href && /^https?:\/\//.test(href)) return href
  if (!href) return fallbackPath
  // A placeholder item («#», owner 2026-10-07: Store and Blog have no page yet) stays where it is — no language, no address.
  if (href.startsWith("#")) return href
  if (LEADING_LANG.test(href)) return href.replace(LEADING_LANG, `/${lang}`)
  return `/${lang}${href}`
}

/** Ссылка на корень проекта у элемента `<a>`/`Link`: абсолютный адрес или путь сайта. */
export const isAbsolute = (href: string) => /^https?:\/\//.test(href)
