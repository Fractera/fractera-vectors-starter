#!/usr/bin/env node
// check-seo-html — СТОРОЖ ЯЗЫКОВЫХ СИГНАЛОВ, ЧИТАЮЩИЙ ОТДАННЫЙ HTML (256-8).
//
// 🔒 ЗАЧЕМ ОН, ЕСЛИ `check-seo` УЖЕ ЕСТЬ. Тот читает ИСХОДНИК — зовёт ли страница
// `buildAlternates`. Измерено 2026-09-20: он печатал `===SEO_OK===`, когда в
// отданном HTML было НОЛЬ тегов `canonical` и `hreflang` — механизм выключался
// изнутри при пустом адресе сайта. Прибор мерил обещание, а не факт. Этот мерит
// факт; старый остаётся и ловит забытый вызов раньше сборки.
//
// 🔒 СТРАХ ВЛАДЕЛЬЦА, РАДИ КОТОРОГО ВСЁ НАПИСАНО, дословно (2026-09-20): «если у
// нас появится множество дублей на разных языках, то наш сайт немедленно попадёт
// в блокировки Google как doorway, и вот это хуже, чем не иметь этих страниц…
// здесь нужен супер сильный сторож».
//
// 🔒 ЧИТАЕТ `.next/server/app/**/*.html` — предрендер. Сервер не нужен, сеть не
// нужна, порядок страниц не важен: проверяется СОСТОЯНИЕ СБОРКИ.
//
// 🛑 МЕСТО ЗАПУСКА ВЫБРАНО ПО УСТРОЙСТВУ: между `next build` и перезапуском
// службы (`scripts/serve.mjs rebuild`). В `prebuild` его поставить нельзя — HTML
// тогда ещё не существует. Сайт с дорвейной разметкой не выкладывается.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join, relative, sep } from "node:path"

const ROOT = process.cwd()
const BUILD = join(ROOT, ".next", "server", "app")

const errors = []
const fail = (where, rule, detail) => errors.push({ where, rule, detail })

// ── Что включено в сборке ──────────────────────────────────────────────────
function envValue(name) {
  if (process.env[name]?.trim()) return process.env[name].trim()
  for (const file of [".env.local", ".env"]) {
    try {
      const line = readFileSync(join(ROOT, file), "utf8")
        .split(/\r?\n/)
        .find(l => l.trim().startsWith(`${name}=`))
      if (line) return line.slice(line.indexOf("=") + 1).trim()
    } catch { /* нет файла — идём дальше */ }
  }
  return ""
}

const LANGS = envValue("NEXT_PUBLIC_SUPPORTED_LANGUAGES").split(",").map(s => s.trim()).filter(Boolean)

/** Адрес сайта — тот же источник, что читает сборка. */
function siteUrl() {
  const path = process.env.APP_CONFIG_PATH ?? join(ROOT, "APP-CONFIG", "app-config.json")
  try {
    return (JSON.parse(readFileSync(path, "utf8")).url ?? "").replace(/\/+$/, "")
  } catch {
    return ""
  }
}

const SITE = siteUrl()
const SHOWCASE_ORIGIN = "https://fractera.ai"
const IS_SHOWCASE = SITE === SHOWCASE_ORIGIN

// ── Чтение одной страницы ──────────────────────────────────────────────────
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith(".html")) out.push(p)
  }
  return out
}

/**
 * Видимый текст ТЕЛА страницы — тем же способом, что в 255, но из `<article>`.
 *
 * ✗ ОПЛАЧЕНО ПРОВЕРКОЙ ПОРЧЕЙ 2026-09-20, И ЭТО БЫЛ ДЕФЕКТ САМОГО ПРИБОРА. Сперва
 * сравнивался текст ВСЕЙ страницы — и детектор дублей не сработал ни разу, хотя
 * русская ячейка была дословной копией английской: меню, крошки и подвал
 * переведены, поэтому страницы целиком не совпадают НИКОГДА. Правило было зелёным
 * не потому, что дублей нет, а потому, что оно не могло их увидеть.
 *
 * 🔒 ДУБЛЬ — ЭТО СОВПАДЕНИЕ СОДЕРЖИМОГО, А НЕ ОБЁРТКИ. Поисковик судит о странице
 * по её телу; одинаковый хром вокруг разного текста дублем не делает, и наоборот.
 */
const visibleText = html => {
  const body = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  return (body ? body[1] : html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function readPage(file) {
  const html = readFileSync(file, "utf8")
  const rel = relative(BUILD, file).split(sep).join("/").replace(/\.html$/, "")
  const lang = rel.split("/")[0]
  return {
    file: relative(ROOT, file),
    rel,
    // 🔒 Маршрут БЕЗ языка — по нему страницы разных языков узнают друг друга.
    route: LANGS.includes(lang) ? rel.slice(lang.length) || "/" : rel,
    lang: LANGS.includes(lang) ? lang : null,
    htmlLang: (html.match(/<html[^>]*lang="([^"]+)"/i) || [])[1] ?? null,
    robots: (html.match(/<meta name="robots" content="([^"]+)"/i) || [])[1] ?? null,
    canonical: (html.match(/<link rel="canonical" href="([^"]+)"/i) || [])[1] ?? null,
    ogUrl: (html.match(/<meta property="og:url" content="([^"]+)"/i) || [])[1] ?? null,
    // 🛑 Next печатает `hrefLang` в camelCase — сверка без `i` даёт пусто и
    // читается как «тегов нет». Оплачено минутой 2026-09-20.
    alts: [...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"/gi)]
      .map(m => ({ lang: m[1], href: m[2] })),
    text: visibleText(html),
    // Приватные поверхности: у них свои правила, см. ниже.
    //
    // 🛑 СЕГМЕНТ ПУТИ, А НЕ ПОДСТРОКА. ✗ Оплачено через минуту после написания:
    // `rel.includes("/architect")` ловил `/ru/architecture` — ПУБЛИЧНУЮ страницу
    // продукта на 480 строк, потому что слово «architecture» начинается с
    // «architect». Сторож объявил нарушением ровно то, что обязан защищать.
    // Тот же класс, что «признак взят по типу, а не по содержимому» (255).
    isArchitect: rel.split("/").includes("architect"),
  }
}

// ── Проверки ───────────────────────────────────────────────────────────────
if (!existsSync(BUILD)) {
  console.error("===SEO_HTML_FAILED=== нет .next/server/app — сборки не существует, проверять нечего")
  process.exit(1)
}

const pages = walk(BUILD).map(readPage).filter(p => p.lang)
if (!pages.length) {
  console.error("===SEO_HTML_FAILED=== не найдено ни одной языковой страницы — проверка смотрит не туда")
  process.exit(1)
}

const indexable = p => p.robots !== null && !/noindex/i.test(p.robots)

// ПРАВИЛО 7 — пустой адрес сайта: индексироваться не может ничто.
if (!SITE) {
  for (const p of pages) {
    if (indexable(p)) fail(p.file, "no-site-indexed", `адреса сайта нет, а страница объявлена индексируемой: ${p.robots}`)
  }
  const robotsTxt = join(BUILD, "robots.txt.body")
  if (existsSync(robotsTxt) && !/Disallow:\s*\/\s*$/m.test(readFileSync(robotsTxt, "utf8"))) {
    fail("robots.txt", "no-site-robots", "адреса сайта нет, а robots.txt не закрывает сайт целиком")
  }
}

// Группировка по маршруту: языковые версии одной страницы.
const byRoute = new Map()
for (const p of pages) {
  if (!byRoute.has(p.route)) byRoute.set(p.route, [])
  byRoute.get(p.route).push(p)
}

for (const [route, group] of byRoute) {
  for (const p of group) {
    // ПРАВИЛО 6 — язык разметки совпадает с языком маршрута.
    if (p.htmlLang && p.htmlLang !== p.lang) {
      fail(p.file, "lang-mismatch", `<html lang="${p.htmlLang}">, а маршрут на «${p.lang}»`)
    }

    // ПРАВИЛО 8 — вне витрины слой архитектора и приватные страницы не индексируемы.
    if (!IS_SHOWCASE && p.isArchitect && indexable(p)) {
      fail(p.file, "private-indexed", `страница слоя объявлена индексируемой вне витрины: ${p.robots}`)
    }

    if (!indexable(p)) continue

    // ПРАВИЛО 1 — ровно один canonical, абсолютный, на себя.
    if (!p.canonical) {
      fail(p.file, "no-canonical", "индексируемая страница без канонического адреса")
    } else if (!/^https?:\/\//.test(p.canonical)) {
      fail(p.file, "canonical-relative", `канонический адрес относительный: ${p.canonical}`)
    }

    // ПРАВИЛО 6б — og:url абсолютен.
    if (p.ogUrl && !/^https?:\/\//.test(p.ogUrl)) {
      fail(p.file, "og-url-relative", `og:url относительный: ${p.ogUrl}`)
    }

    // ПРАВИЛО 2 — в hreflang нет непереведённых версий.
    for (const a of p.alts) {
      if (a.lang === "x-default") continue
      const sibling = group.find(s => s.lang === a.lang)
      if (sibling && !indexable(sibling)) {
        fail(p.file, "hreflang-untranslated", `объявляет переводом «${a.lang}», а та версия несёт noindex`)
      }
    }

    // ПРАВИЛО 3 — взаимность.
    for (const a of p.alts) {
      if (a.lang === "x-default" || a.lang === p.lang) continue
      const sibling = group.find(s => s.lang === a.lang)
      if (!sibling || !indexable(sibling)) continue
      if (!sibling.alts.some(b => b.lang === p.lang)) {
        fail(p.file, "hreflang-one-way", `называет «${a.lang}», а «${a.lang}» не называет «${p.lang}» в ответ`)
      }
    }
  }

  const live = group.filter(indexable)

  // ПРАВИЛО 4 — две версии не делят один canonical.
  const seen = new Map()
  for (const p of live) {
    if (!p.canonical) continue
    if (seen.has(p.canonical)) {
      fail(p.file, "canonical-shared", `тот же канонический адрес, что у ${seen.get(p.canonical)}: ${p.canonical}`)
    }
    seen.set(p.canonical, p.file)
  }

  // 🔒 ПРАВИЛО 5 — ДЕТЕКТОР ДУБЛЕЙ, прямая машинная формулировка страха владельца:
  // «если у нас появится множество дублей на разных языках, сайт немедленно
  // попадёт в блокировки Google как doorway».
  //
  // ✗ СНАЧАЛА ЗДЕСЬ СТОЯЛО ТОЧНОЕ СРАВНЕНИЕ, И ОНО НЕ ПОЙМАЛО НИ ОДНОГО ДУБЛЯ.
  // Проверка порчей 2026-09-20: русская ячейка `architecture` подменена дословной
  // копией английской — 24 139 знаков против 24 135, различие в ЧЕТЫРЁХ СЛОВАХ
  // интерфейса («На этой странице» против «On this page»). Точное совпадение —
  // негодный признак: настоящий дубль почти всегда «почти», а не «точно».
  //
  // 🔒 МЕРА — ДОЛЯ ОБЩИХ СЛОВ, И ПОРОГ ВЫСОК НЕ СЛУЧАЙНО. У честных переводов
  // словари РАЗНЫХ ЯЗЫКОВ пересекаются мало (имена, числа, термины) — доля редко
  // выше 0.3. У дубля она близка к единице. Порог 0.9 оставляет запас на хром и
  // не даёт ложных срабатываний на настоящем переводе.
  const words = t => new Set(t.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = words(live[i].text)
      const b = words(live[j].text)
      if (a.size < 20 || b.size < 20) continue // слишком коротко, чтобы судить
      let common = 0
      for (const w of a) if (b.has(w)) common++
      const similarity = common / Math.max(a.size, b.size)
      if (similarity >= 0.9) {
        fail(
          live[i].file,
          "duplicate-text",
          `текст совпадает с ${live[j].file} на ${Math.round(similarity * 100)}%, и обе индексируемы (маршрут ${route})`,
        )
      }
    }
  }
}

// ── Закон 340: поисковику — только открытые языки ─────────────────────────
//
// 🔒 ЛЮДЯМ ВИДНЫ ВСЕ ВКЛЮЧЁННЫЕ ЯЗЫКИ, ПОИСКОВИКУ — ТОЛЬКО ОТКРЫТЫЕ: английский, язык по умолчанию и разблокированные
// человеком (`NEXT_PUBLIC_INDEXED_LANGUAGES`). Тот же расчёт, что `INDEXED_LANGUAGES` в `translations.config.ts`: два
// расчёта одного набора — это два ответа на один вопрос, поэтому формула повторена дословно и сторож краснеет порчей.
// Слова владельца 2026-09-30: «запускать проект продакшн рекомендуется только на одном или двух языках… английский язык
// плюс язык по дефолту»; «Также создай seo сторожа».
const DEFAULT = (envValue("NEXT_PUBLIC_DEFAULT_LOCALE") || "en").toLowerCase()
const UNLOCKED = envValue("NEXT_PUBLIC_INDEXED_LANGUAGES").split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
const OPEN = LANGS.filter(l => l === "en" || l === DEFAULT || UNLOCKED.includes(l))

for (const p of pages) {
  // ПРАВИЛО 9 — страница закрытого языка не индексируется.
  if (!OPEN.includes(p.lang) && indexable(p) && !(IS_SHOWCASE && p.isArchitect)) {
    fail(p.file, "closed-language-indexed", `язык «${p.lang}» закрыт для поисковика, а страница объявлена индексируемой: ${p.robots}`)
  }
  // ПРАВИЛО 10 — закрытая версия не объявляет переводов: её hreflang односторонний по построению (замер 340-1, aifa.dev/fr).
  if (!indexable(p) && p.alts.some(a => a.lang !== p.lang)) {
    fail(p.file, "noindex-with-hreflang", `страница с noindex объявляет переводы: ${p.alts.map(a => a.lang).join(",")}`)
  }
  // ПРАВИЛО 11 — hreflang не называет закрытый язык.
  for (const a of p.alts) {
    if (a.lang !== "x-default" && !OPEN.includes(a.lang)) {
      fail(p.file, "hreflang-closed-language", `hreflang называет закрытый для поисковика язык «${a.lang}»`)
    }
  }
}

// ПРАВИЛО 12 — карта сайта не зовёт на закрытые языки. Карта может строиться при запросе, а не в сборке — тогда её здесь
// нет, и это называется строкой, а не молчанием (живую карту меряет `npm run check:index`).
const sitemapBody = ["sitemap.xml.body", "sitemap.xml"].map(n => join(BUILD, n)).find(existsSync)
if (sitemapBody && SITE) {
  for (const m of readFileSync(sitemapBody, "utf8").matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const seg = m[1].slice(SITE.length).split("/")[1] ?? ""
    if (LANGS.includes(seg) && !OPEN.includes(seg)) fail("sitemap.xml", "sitemap-closed-language", `карта зовёт на закрытый язык: ${m[1]}`)
  }
} else if (!sitemapBody) {
  console.log("карта сайта в сборке не найдена — правило 12 проверяется на живом сайте: npm run check:index")
}

// ПРАВИЛО 13 — robots.txt не запрещает язык. «For the noindex rule to be effective, the page… must not be blocked by a
// robots.txt file» (Google, block-indexing): запрет спрятал бы noindex, и закрытые страницы могли бы остаться в индексе.
const robotsBody = join(BUILD, "robots.txt.body")
if (existsSync(robotsBody)) {
  for (const line of readFileSync(robotsBody, "utf8").split(/\r?\n/)) {
    const d = (line.match(/^\s*disallow:\s*(\S+)/i) ?? [])[1]
    const seg = d?.replace(/\*$/, "").replace(/\/$/, "").split("/")
    if (seg && seg.length === 2 && LANGS.includes(seg[1])) {
      fail("robots.txt", "robots-blocks-language", `robots.txt запрещает язык целиком (${d}) — его noindex не прочтётся`)
    }
  }
}

// ── Итог ───────────────────────────────────────────────────────────────────
const shown = pages.length
const live = pages.filter(indexable).length
console.log(`страниц в сборке: ${shown}, индексируемых: ${live}, языков: ${LANGS.join(",") || "—"}, открыто поисковику: ${OPEN.join(",") || "—"}`)
console.log(`адрес сайта: ${SITE || "(не задан)"}${IS_SHOWCASE ? " — ВИТРИНА" : ""}`)

if (!errors.length) {
  console.log("\n===SEO_HTML_OK=== языковые сигналы согласованы")
  process.exit(0)
}

console.error(`\n===SEO_HTML_FAILED=== нарушений: ${errors.length}\n`)
for (const e of errors.slice(0, 30)) {
  console.error(`  ${e.rule.padEnd(22)} ${e.where}\n${" ".repeat(25)}${e.detail}`)
}
if (errors.length > 30) console.error(`  (+${errors.length - 30})`)
process.exit(1)
