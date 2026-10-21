#!/usr/bin/env node
// check-index — ЧТО ОТКРЫТО ПОИСКОВИКУ НА ЖИВОМ САЙТЕ (шаг 340-1).
//
// `node scripts/check-index.mjs https://example.com --langs en,ru,fr [--pages /,/blog]`
// `node scripts/check-index.mjs --file page.html` — разобрать один сохранённый HTML (негативный контроль прибора).
//
// 🔒 ЗАЧЕМ ЕЩЁ ОДИН ПРИБОР. `check-seo` читает исходник, `check-seo-html` — предрендер сборки. Ни один не отвечает на вопрос
// владельца «что поисковик видит СЕЙЧАС»: сборка на диске и сайт в интернете расходятся (предпросмотр не принят, кеш,
// старый процесс). Этот спрашивает сеть — тем же путём, каким приходит робот.
//
// 🔒 ПОЧЕМУ ИМЕННО ЭТИ ТРИ СИГНАЛА (Google Search Central, прочитано 2026-09-30):
//   • `<meta name="robots">` — noindex работает, только если страница НЕ закрыта в robots.txt («must not be blocked by a
//     robots.txt file»), поэтому robots.txt печатается рядом: запрет там прячет noindex;
//   • `hreflang` — взаимен или игнорируется целиком («page Y must link back to page X»): прибор ищет односторонние;
//   • `sitemap.xml` — список того, что сайт сам предлагает индексировать.
//
// Печатает таблицу «страница × язык» и в конце `===INDEX_TABLE===`; односторонний hreflang, закрытая в robots.txt страница с
// noindex и страница из sitemap с noindex — отдельными строками «ВНИМАНИЕ». Код выхода 0 — это прибор, а не сторож.

import { readFileSync } from "node:fs"

const args = process.argv.slice(2)
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }

// ── Разбор одной страницы ────────────────────────────────────────────────────
function attrs(tag) {
  const out = {}
  for (const m of tag.matchAll(/([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) out[m[1].toLowerCase()] = m[3] ?? m[4] ?? ""
  return out
}
function parse(html) {
  const head = html.split(/<\/head>/i)[0] ?? html
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrs(m[0]))
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]))
  const robots = metas.filter((a) => /^(robots|googlebot)$/i.test(a.name ?? "")).map((a) => `${a.name}: ${a.content}`)
  const canonical = links.find((a) => /(^|\s)canonical(\s|$)/i.test(a.rel ?? ""))?.href ?? ""
  const hreflang = Object.fromEntries(
    links.filter((a) => /(^|\s)alternate(\s|$)/i.test(a.rel ?? "") && a.hreflang).map((a) => [a.hreflang, a.href]),
  )
  const lang = (html.match(/<html\b[^>]*\blang\s*=\s*"([^"]+)"/i) ?? [])[1] ?? ""
  const noindex = robots.some((r) => /noindex|none/i.test(r))
  return { robots, canonical, hreflang, lang, noindex }
}

if (opt("--file")) {
  const r = parse(readFileSync(opt("--file"), "utf8"))
  console.log(JSON.stringify(r, null, 2))
  console.log(r.noindex ? "INDEX: noindex" : "INDEX: index")
  process.exit(0)
}

// ── Живой сайт ───────────────────────────────────────────────────────────────
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? "").replace(/\/+$/, "")
if (!base) { console.error("usage: check-index.mjs <https://site> --langs en,ru[,..] [--pages /,/blog] | --file page.html"); process.exit(2) }
const langs = (opt("--langs") ?? "en").split(",").map((s) => s.trim()).filter(Boolean)
const extraPages = (opt("--pages") ?? "/").split(",").map((s) => s.trim()).filter(Boolean)

// Корень с косой чертой и без — один адрес: иначе каждый hreflang на главную выглядит односторонним.
const norm = (u) => u.replace(/\/+$/, "")

async function get(url) {
  try {
    const r = await fetch(url, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0 (compatible; fractera-check-index/1.0)", "cache-control": "no-cache" } })
    return { status: r.status, location: r.headers.get("location") ?? "", xrobots: r.headers.get("x-robots-tag") ?? "", text: r.status === 200 ? await r.text() : "" }
  } catch (e) { return { status: 0, location: "", xrobots: "", text: "", error: String(e) } }
}

const robotsTxt = (await get(`${base}/robots.txt`)).text
const disallow = robotsTxt.split(/\r?\n/).filter((l) => /^disallow:/i.test(l.trim())).map((l) => l.split(":").slice(1).join(":").trim()).filter(Boolean)
const disallowSet = [...new Set(disallow)]
const blocked = (path) => disallow.some((d) => d === "/" || path.startsWith(d))

const sm = await get(`${base}/sitemap.xml`)
const smLocs = [...sm.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1])

// Адреса к проверке: всё из карты + каждая страница `--pages` на каждом языке (карта может не называть закрытые).
const urls = new Set(smLocs)
for (const p of extraPages) for (const l of langs) urls.add(`${base}/${l}${p === "/" ? "" : p}`)

const rows = []
for (const url of [...urls].sort()) {
  const r = await get(url)
  const path = url.slice(base.length) || "/"
  if (r.status !== 200) { rows.push({ url, path, status: r.status, location: r.location }); continue }
  const p = parse(r.text)
  rows.push({ url, path, status: 200, ...p, xrobots: r.xrobots, inSitemap: smLocs.includes(url), blocked: blocked(path) })
}

console.log(`robots.txt Disallow (без повторов): ${disallowSet.length ? disallowSet.join("  ") : "(нет)"}`)
console.log(`sitemap.xml: ${smLocs.length} адресов (HTTP ${sm.status})`)
console.log("")
console.log(["адрес", "HTTP", "lang", "индекс", "в sitemap", "hreflang", "canonical"].join(" | "))
for (const r of rows) {
  if (r.status !== 200) { console.log([r.path, r.status, "", "", "", "", r.location ? `→ ${r.location}` : ""].join(" | ")); continue }
  const idx = r.noindex ? `noindex (${r.robots.join("; ")})` : r.xrobots ? `header: ${r.xrobots}` : "index"
  const hl = Object.keys(r.hreflang).join(",") || "—"
  const canon = norm(r.canonical) === norm(r.url) ? "self" : r.canonical || "—"
  console.log([r.path, 200, r.lang, idx, r.inSitemap ? "да" : "нет", hl, canon].join(" | "))
}

// ── Предупреждения ───────────────────────────────────────────────────────────
const warn = []
const byUrl = new Map(rows.filter((r) => r.status === 200).map((r) => [norm(r.url), r]))
const notes = []
for (const r of byUrl.values()) {
  // Закрытая или неканоническая страница в наборе переводов не участвует: её hreflang поисковик не учитывает. Односторонние
  // ссылки с неё — не дефект, а лишний текст; называется заметкой, чтобы не тонули настоящие предупреждения.
  const canonical = !r.canonical || norm(r.canonical) === norm(r.url)
  if (r.noindex || !canonical) {
    if (Object.keys(r.hreflang).length) notes.push(`${r.path}: ${r.noindex ? "noindex" : "не канонический адрес"}, но несёт hreflang (${Object.keys(r.hreflang).join(",")})`)
    if (r.noindex && r.blocked) warn.push(`noindex не прочтётся — адрес закрыт в robots.txt: ${r.path}`)
    if (r.noindex && r.inSitemap) warn.push(`в sitemap страница с noindex: ${r.path}`)
    continue
  }
  for (const [hl, href] of Object.entries(r.hreflang)) {
    if (hl === "x-default" || norm(href) === norm(r.url)) continue
    const other = byUrl.get(norm(href))
    if (other && !Object.values(other.hreflang).map(norm).includes(norm(r.url))) warn.push(`односторонний hreflang: ${r.path} → ${href} (обратной ссылки нет)`)
    if (other?.noindex) warn.push(`hreflang ведёт на noindex: ${r.path} → ${href}`)
  }
}
console.log("")
for (const w of warn) console.log(`ВНИМАНИЕ: ${w}`)
for (const n of notes) console.log(`заметка: ${n}`)
if (!warn.length) console.log("предупреждений нет")
console.log("===INDEX_TABLE===")
