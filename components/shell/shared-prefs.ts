import { readStored, writeStored } from "./safe-storage"

// ОДНИ НАСТРОЙКИ ПОСЕТИТЕЛЯ НА ВСЕХ СТРАНИЦАХ ПРОЕКТА (шаг 285-2).
//
// Слово владельца 2026-09-24: «если я на любой странице сделал тему тёмной то значит она везде тёмная если я на
// любой странице сделал тему страница широкая значит они везде широкие». Сайт, вход и ядро живут на разных
// поддоменах (`throughsongs.com`, `auth.`, `architect.`), а память браузера (`localStorage`) у каждого адреса
// своя — поэтому выбор, сделанный на одном, другие не видели.
//
// 🔒 ИСТОЧНИК — COOKIE НА ВЕСЬ ДОМЕН ПРОЕКТА (`.<зона>`): его видит каждый поддомен. Без домена (IP, localhost)
// cookie ставится без атрибута `domain` — и он всё равно общий для всех служб машины: cookie не различает порты.
// `localStorage` пишется рядом как запасной путь, если cookie браузер не принял.
//
// 🔒 ОДИН ФАЙЛ У САЙТА И У КАЖДОЙ СЛУЖБЫ С ЭТОЙ ОБОЛОЧКОЙ, БАЙТ В БАЙТ: разные правила чтения у двух копий дали
// бы ровно тот «калейдоскоп», ради которого файл заведён.

const YEAR = 365 * 24 * 60 * 60

/** Домен cookie для всех служб проекта: `.<два последних ярлыка>`. IP и localhost — `null` (cookie без домена). */
export function prefCookieDomain(host: string): string | null {
  const h = host.replace(/:\d+$/, "").toLowerCase()
  if (!h.includes(".") || /^[\d.]+$/.test(h) || h.startsWith("[")) return null
  return "." + h.split(".").slice(-2).join(".")
}

function readCookie(key: string): string | null {
  try {
    const m = document.cookie.match(new RegExp("(?:^|; )" + key + "=([^;]*)"))
    return m ? decodeURIComponent(m[1]) : null
  } catch {
    return null
  }
}

/**
 * Выбор посетителя: cookie проекта, иначе память этого адреса.
 *
 * 🔒 ВЫБОР, СДЕЛАННЫЙ ДО 285-2, ПОДНИМАЕТСЯ В COOKIE ПРОЕКТА ПРИ ПЕРВОМ ЧТЕНИИ. Раньше тема и ширина жили
 * только в памяти адреса: владелец выбрал тёмную на сайте и в ядре, а вход о ней не знал. Без переноса
 * пришлось бы выбирать заново — и первым открытым адресом решалось бы, какой выбор «настоящий».
 */
export function readPref(key: string): string | null {
  const fromCookie = readCookie(key)
  if (fromCookie !== null) return fromCookie
  const stored = readStored(key)
  if (stored !== null && typeof document !== "undefined") writePref(key, stored)
  return stored
}

/** Записать выбор так, чтобы его увидели все страницы проекта. */
export function writePref(key: string, value: string): void {
  writeStored(key, value)
  try {
    const base = `${key}=${encodeURIComponent(value)}; path=/; max-age=${YEAR}; samesite=lax` + (location.protocol === "https:" ? "; secure" : "")
    const domain = prefCookieDomain(location.host)
    document.cookie = domain ? `${base}; domain=${domain}` : base
    // Зона оказалась публичным суффиксом (`co.uk`) — браузер молча отверг cookie; тогда хотя бы этот адрес.
    if (domain && readCookie(key) !== value) document.cookie = base
  } catch {
    /* cookie недоступен — остаётся память этого адреса */
  }
}

/** То же чтение строкой JavaScript — для скриптов, которые ставят тему и ширину ДО отрисовки. */
export const READ_PREF_JS =
  "function(k){try{var m=document.cookie.match(new RegExp('(?:^|; )'+k+'=([^;]*)'));if(m)return decodeURIComponent(m[1]);}catch(e){}try{return localStorage.getItem(k);}catch(e){return null}}"
