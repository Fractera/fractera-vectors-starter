import type { ShellData, ShellGroup } from "./shell-types"

// ДАННЫЕ ОБОЛОЧКИ У СЛУЖБЫ — ИЗ ДВЕРИ САЙТА (шаг 285-3). Сайт этот файл не использует (у него свои данные,
// `lib/shell/site-shell-data.ts`); он едет в каждую службу вместе с видом.
//
// Сервер службы спрашивает сайт по петле (`PROJECT_SHELL_URL`, выдаёт установщик узла), а адреса делает
// абсолютными на тот адрес, до которого дотянется браузер человека (`PROJECT_SITE_URL`): на своём домене —
// корень зоны, иначе петля с портом сайта. Читается на СБОРКЕ страницы — страницы остаются статическими.
//
// 🔒 ОДИН ЗАПРОС НА ЯЗЫК ЗА КОРОТКОЕ ОКНО, ПОВТОР И ГРОМКИЙ ОТКАЗ. ✗ оплачено 283-3/283-4: ядро под нагрузкой сборки
// молча откатилось на своё меню (4 кнопки из 9). Сайт не ответил — `null` и строка в журнале сборки.
// 🛑 ОКНО — СЕКУНДЫ, А НЕ ЖИЗНЬ ПРОЦЕССА (299-6). ✗ Оплачено 2026-09-25: запоминание «за процесс» держало первый ответ
// сайта вечно — кэш Next истекал через минуты, повторный рендер получал тот же старый ответ, и шапка «Блоков» менялась
// только перезапуском. Окно гасит лишь всплеск запросов одной сборки; правка меню доходит со следующим рендером.
const MEMO_MS = 30_000
const memo = new Map<string, { at: number; job: Promise<ShellData | null> }>()

const trim = (s: string) => s.replace(/\/+$/, "")

function absolute(groups: ShellGroup[], base: string, lang: string): ShellGroup[] {
  return groups.map((g) => {
    if (g.inert) return g
    const own = g.href && /^https?:\/\//.test(g.href) ? g.href : `${base}/${lang}${g.href ?? `/${g.slug}`}`
    return {
      ...g,
      href: own,
      children: g.children.map((c) => ({
        ...c,
        href: c.href && /^https?:\/\//.test(c.href) ? c.href : `${base}/${lang}${c.href ?? `${g.href ?? `/${g.slug}`}/${c.slug}`}`,
      })),
    }
  })
}

/** Путь сайта (`/ru/architect`) → абсолютный адрес сайта; абсолютный — как есть. */
const siteLink = (base: string, href: string) => (/^https?:\/\//.test(href) ? href : `${base}${href}`)

async function ask(url: string): Promise<ShellData> {
  let last: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as ShellData
      if (!Array.isArray(data?.top)) throw new Error("no top in answer")
      return data
    } catch (err) {
      last = err
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  throw last
}

/**
 * `where` — адреса, если поверхность знает их сама (ядро узла выводит их из реестра и домена); иначе —
 * окружение службы, которое выдаёт установщик узла.
 */
export function loadProjectShell(lang: string, where?: { shellUrl?: string | null; siteUrl?: string | null }): Promise<ShellData | null> {
  const hit = memo.get(lang)
  if (hit && Date.now() - hit.at < MEMO_MS) return hit.job
  const shellUrl = (where?.shellUrl ?? process.env.PROJECT_SHELL_URL)?.trim()
  const base = trim((where?.siteUrl ?? process.env.PROJECT_SITE_URL)?.trim() ?? "")
  const job = (async () => {
    if (!shellUrl || !base) {
      console.warn(`[project-shell] ${lang}: нет PROJECT_SHELL_URL или PROJECT_SITE_URL — шапки и подвала проекта не будет`)
      return null
    }
    const url = `${trim(shellUrl)}/${lang}`
    try {
      const d = await ask(url)
      return {
        ...d,
        home: siteLink(base, d.home),
        top: absolute(d.top, base, lang),
        footer: absolute(d.footer, base, lang),
        account: d.account ? { ...d.account, links: d.account.links.map((l) => ({ ...l, href: siteLink(base, l.href) })) } : null,
      }
    } catch (err) {
      console.warn(`[project-shell] ${lang}: сайт не ответил (${url}: ${err instanceof Error ? err.message : err}) — шапки и подвала проекта не будет`)
      return null
    }
  })()
  memo.set(lang, { at: Date.now(), job })
  return job
}
