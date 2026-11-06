// check-data-langs — сторож языков у данных страниц: `_data/<язык>.json` (узел, шаг 659, 2026-11-06).
// Запуск: npm run check:data-langs (часть prebuild).
//
// 🔒 ЗАЧЕМ. Публичная страница, лендинг, главная root берут слова и СПИСКИ из `_data/en.json`, `ru.json`, … — по файлу на язык.
// Перевод — это те же карточки, разделы и пункты в том же порядке, только другими словами. До этого шага их не сравнивал ни один
// сторож: root без карточки `personal` в ru.json проходил check-lang-delivery и check-content, и русский посетитель увидел бы пять
// карточек вместо шести (измерено 2026-11-05, шаг 654-7; слово владельца 2026-11-06: «fix it»). check-i18n смотрит словари
// интерфейса, а не эти файлы.
//
// 🔒 ЧТО СРАВНИВАЕТСЯ. Каждый язык папки — с `en.json`, основой: в каждой точке тот же вид (объект, список, строка, число, да/нет),
// те же ключи объектов, та же длина списков, те же значения ключей-имён `id`, `bid`, `kind` (по ним страница находит свой блок) и
// непустая строка там, где она непустая в en. Сами слова не сравниваются: они и должны различаться. Ключ, пустой на своей стороне
// (`""` или `null`), может отсутствовать на другой: переводить в нём нечего (у пяти страниц шаблона `keywords: ""` есть только в en —
// измерено 2026-11-06 во всех элементах узла).
//
// 🛑 ЧТО НЕ ПРОВЕРЯЕТСЯ, НАМЕРЕННО. Сколько языков у папки и включены ли они: лишний или недостающий язык — не беда (слово владельца
// 2026-09-21 в шапке check-lang-delivery; язык без файла получает английский). Файл не на двухбуквенный код (`meta.json`) — не язык:
// все 82 кода узла двухбуквенные (`config/translations/language-metadata.ts`).

import fs from "node:fs"
import path from "node:path"
import { isForeign } from "./microservices-boundary.mjs"

const ROOT = process.cwd()
const LANG_FILE = /^([a-z]{2})\.json$/
const NAMES = ["id", "bid", "kind"]
const LIMIT = 8

/** Каждая папка `_data` под `app/`, на любой глубине. */
function dataFolders(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".") || isForeign(name)) continue
    const child = path.join(dir, name)
    if (!fs.statSync(child).isDirectory()) continue
    if (name === "_data") out.push(child)
    dataFolders(child, out)
  }
  return out
}

const kindOf = (v) =>
  Array.isArray(v) ? "список" : v === null ? "null" : typeof v === "object" ? "объект"
    : typeof v === "string" ? "строка" : typeof v === "number" ? "число" : typeof v === "boolean" ? "да/нет" : typeof v

/** Имя пункта списка — его `id`, `bid` или `kind`, если он объект и имя есть. */
const nameOf = (item) =>
  item && typeof item === "object" && !Array.isArray(item) ? NAMES.map((k) => item[k]).find((v) => typeof v === "string") : undefined

/** Пустое значение: в нём нечего переводить. */
const blank = (v) => v === null || (typeof v === "string" && !v.trim())

function compare(base, other, where, out) {
  const kb = kindOf(base)
  const ko = kindOf(other)
  if (kb !== ko) { out.push(`${where || "(весь файл)"}: в en ${kb}, здесь ${ko}`); return }
  if (kb === "список") {
    if (base.length !== other.length) {
      const bn = base.map(nameOf)
      const on = other.map(nameOf)
      let line = `${where || "(весь файл)"}: в en ${base.length}, здесь ${other.length}`
      if (bn.every(Boolean) && on.every(Boolean)) {
        const missing = bn.filter((n) => !on.includes(n))
        const extra = on.filter((n) => !bn.includes(n))
        if (missing.length) line += ` — нет ${missing.join(", ")}`
        if (extra.length) line += ` — лишние ${extra.join(", ")}`
      }
      out.push(line)
      return
    }
    base.forEach((b, i) => compare(b, other[i], `${where}[${nameOf(b) ?? i}]`, out))
    return
  }
  if (kb === "объект") {
    for (const k of Object.keys(base)) {
      if (!(k in other)) { if (!blank(base[k])) out.push(`${where}.${k}: нет здесь`); continue }
      if (NAMES.includes(k) && typeof base[k] === "string" && base[k] !== other[k]) {
        out.push(`${where}.${k}: в en «${base[k]}», здесь «${other[k]}»`)
        continue
      }
      compare(base[k], other[k], `${where}.${k}`, out)
    }
    for (const k of Object.keys(other)) if (!(k in base) && !blank(other[k])) out.push(`${where}.${k}: лишний ключ, в en его нет`)
    return
  }
  if (kb === "строка" && base.trim() && !other.trim()) out.push(`${where}: пусто, в en «${base.slice(0, 40)}»`)
}

function read(file) {
  try { return { json: JSON.parse(fs.readFileSync(file, "utf8")) } } catch (e) { return { error: e.message } }
}

let bad = 0
let compared = 0
for (const dir of dataFolders(path.join(ROOT, "app"))) {
  const langs = fs.readdirSync(dir).map((f) => f.match(LANG_FILE)?.[1]).filter(Boolean)
  if (!langs.length) continue
  const rel = path.relative(ROOT, dir)
  if (!langs.includes("en")) {
    console.log(`  БЕДА  ${rel}: ${langs.map((l) => `${l}.json`).join(", ")} без en.json — не с чем сравнить`)
    bad++
    continue
  }
  const base = read(path.join(dir, "en.json"))
  if (base.error) { console.log(`  БЕДА  ${rel}/en.json — не JSON: ${base.error}`); bad++; continue }
  for (const lang of langs.filter((l) => l !== "en").sort()) {
    compared++
    const other = read(path.join(dir, `${lang}.json`))
    if (other.error) { console.log(`  БЕДА  ${rel}/${lang}.json — не JSON: ${other.error}`); bad++; continue }
    const out = []
    compare(base.json, other.json, "", out)
    if (!out.length) continue
    bad++
    console.log(`  БЕДА  ${rel}/${lang}.json против en.json:`)
    for (const line of out.slice(0, LIMIT)) console.log(`         ${line}`)
    if (out.length > LIMIT) console.log(`         (+${out.length - LIMIT})`)
  }
}
console.log(bad
  ? `\n===DATA_LANGS_FAILED=== файлов с расхождением: ${bad} (сравнено ${compared})`
  : `===DATA_LANGS_OK=== сравнено файлов: ${compared}, каждый повторяет en.json`)
process.exit(bad ? 1 : 0)
