// ШРИФТЫ СО СВОЕГО СЕРВЕРА (шаг 315). Перед сборкой кладёт файлы шрифтов каталога в `public/fonts/`
// и проверяет, что у каждого шрифта каталога они есть.
//
// Слово владельца 2026-09-26 о шрифтах с fonts.googleapis.com: «critical error». Без интернета (узел в домашней
// сети, кэш «Без интернета» у посетителя) страница рисовалась системным шрифтом.
//
// 🔒 ФАЙЛЫ ЕДУТ ИЗ npm, А НЕ ИЗ git. Пакеты `@fontsource*` ставятся вместе с остальными зависимостями, этот скрипт
// копирует нужные `.woff2` и таблицу `@font-face` к ним; `public/fonts/` в `.gitignore`. Во время работы узел
// ничего не скачивает.
// 🔒 ИМЯ СЕМЕЙСТВА ПЕРЕПИСЫВАЕТСЯ: пакет называет шрифт «Inter Variable», а настройки и каталог — «Inter».
// Без замены `font-family: "Inter"` не нашёл бы ни одного правила, и страница молча осталась бы системной.
//
// Запуск: `node scripts/local-fonts.mjs [корень Next-проекта]`. Корень по умолчанию — папка над `scripts/`.
// Таблица — `<корень>/lib/design/local-fonts.json`, каталог (если есть) — `<корень>/lib/design/font-catalogue.ts`.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const ROOT = process.argv[2] ? resolve(process.argv[2]) : join(dirname(fileURLToPath(import.meta.url)), "..")
const TABLE = join(ROOT, "lib", "design", "local-fonts.json")
const CATALOGUE = join(ROOT, "lib", "design", "font-catalogue.ts")
const OUT = join(ROOT, "public", "fonts")
const require = createRequire(join(ROOT, "package.json"))

const errors = []
const fail = (why) => errors.push(why)

if (!existsSync(TABLE)) {
  console.error(`===LOCAL_FONTS_FAILED=== нет таблицы ${TABLE}`)
  process.exit(1)
}
const { fonts } = JSON.parse(readFileSync(TABLE, "utf8"))

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

let bytes = 0
for (const f of fonts) {
  let pkgDir
  try {
    pkgDir = dirname(require.resolve(`${f.pkg}/package.json`))
  } catch {
    fail(`${f.family}: пакет ${f.pkg} не установлен`)
    continue
  }
  const dir = join(OUT, f.slug)
  mkdirSync(dir, { recursive: true })
  let css = ""
  for (const name of f.css) {
    const src = join(pkgDir, name)
    if (!existsSync(src)) {
      fail(`${f.family}: в пакете нет ${name}`)
      continue
    }
    css += readFileSync(src, "utf8").replace(/url\(\.\/files\/([^)]+)\)/g, (_, file) => {
      const from = join(pkgDir, "files", file)
      if (!existsSync(from)) {
        fail(`${f.family}: нет файла ${file}`)
        return `url(/fonts/${f.slug}/${file})`
      }
      copyFileSync(from, join(dir, file))
      bytes += readFileSync(from).length
      return `url(/fonts/${f.slug}/${file})`
    })
  }
  css = css.replace(/font-family:\s*'[^']*'/g, `font-family: '${f.family}'`)
  writeFileSync(join(OUT, `${f.slug}.css`), css)
}

// Каждый файл, названный в таблице стилей, обязан лежать на месте — это и есть проверка результата, а не намерения.
for (const f of fonts) {
  const cssFile = join(OUT, `${f.slug}.css`)
  if (!existsSync(cssFile)) continue
  const urls = [...readFileSync(cssFile, "utf8").matchAll(/url\(\/fonts\/([^)]+)\)/g)].map((m) => m[1])
  if (!urls.length) fail(`${f.family}: в ${f.slug}.css ни одного файла`)
  for (const u of urls) if (!existsSync(join(OUT, u))) fail(`${f.family}: ${u} не скопирован`)
}

// Каждый внешний шрифт каталога обязан быть в таблице — иначе выбор владельца молча станет системным шрифтом.
if (existsSync(CATALOGUE)) {
  const src = readFileSync(CATALOGUE, "utf8")
  const known = new Set(fonts.map((f) => f.family))
  const families = [...src.matchAll(/\{\s*family:\s*"([^"]+)"/g)].map((m) => m[1])
  if (!families.length) fail(`в каталоге ${CATALOGUE} не найдено ни одного семейства`)
  for (const fam of families) if (!known.has(fam)) fail(`каталог: «${fam}» нет в local-fonts.json`)
  if (/fonts\.(googleapis|gstatic)\.com/.test(src)) fail("каталог ещё ссылается на fonts.googleapis.com")
}

if (errors.length) {
  console.error(`===LOCAL_FONTS_FAILED=== ошибок: ${errors.length}\n  ` + errors.join("\n  "))
  process.exit(1)
}
console.log(`===LOCAL_FONTS_OK=== ${fonts.length} шрифтов, ${Math.round(bytes / 1024)} КБ в public/fonts`)
