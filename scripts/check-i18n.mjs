// check-i18n — сторож словарей интерфейса.
//
// 🔒 ЗАЧЕМ. Словарь на 82 языка глазами не проверяют: пропущенный ключ в сорок
// седьмом языке роняет сборку типами, лишний язык тихо не работает, а язык,
// написанный не в том порядке, ломает сравнение при следующей правке. Всё это
// находится за секунду скриптом и за час — руками.
//
// Проверяются ДВЕ вещи, и обе — по факту, а не по обещанию:
//   • сколько языков в словаре против ожидаемого числа;
//   • есть ли в КАЖДОМ языке все ключи, объявленные в его типе.
//
// Список файлов ведётся здесь руками намеренно: новый словарь должен попадать
// под охрану осознанно, вместе с решением, сколько языков он обязан нести.
// Автоматический обход папок молча пропустил бы файл, названный иначе.

import fs from "fs"

/** [файл, имя типа, сколько языков обязано быть] */
//
// 🪦 ПРАВИЛО 4д («82 языка у переиспользуемых частей продукта») ОТМЕНЕНО В ЭТОМ
// ПРОЕКТЕ 2026-09-20, шаг 255. Решение владельца, дословно: «я хочу начать с
// минимальной достаточного набора чтобы создать идеальный паттерн поэтому у всех
// просто сейчас должен остаться русский и английский язык пройти по всему
// приложению».
//
// 🔒 ЧТО ДЕЙСТВУЕТ ВМЕСТО НЕГО: ДВА ЯЗЫКА ВЕЗДЕ. `en` — основа, обязательная;
// `ru` — перевод. Язык, которого нет, деградирует до английского — это и раньше
// было поведением резолвера, просто скрытым за полным словарём.
//
// 🛑 ЦЕНА НАЗВАНА ВСЛУХ, А НЕ ЗАМОЛЧАНА: здесь срезаны НАСТОЯЩИЕ переводы, а не
// заглушки, — 80 языков у девяти переиспользуемых словарей. Включив завтра
// третий язык, владелец получит на нём английский интерфейс. Адрес возврата —
// коммит шага 255 и `fractera-next-starter`; запись — в
// `development-docs/TRANSLATION-DEBT.md`.
//
// 🔒 ЧИСЛО ЗДЕСЬ ГОВОРИТ ПРАВДУ О СЕГОДНЯШНЕМ ДЕРЕВЕ, А ОБЕЩАНИЕ ЖИВЁТ В РЕЕСТРЕ
// ДОЛГА. Разведение это старше шага 255 (244-3) и не отменяется им: прибор
// меряет, реестр обещает, и меняются они одним заходом.
const FILES = [
  // Переиспользуемые части продукта — меню, согласие на cookie, модальные окна.
  ["components/menu/account/account-menu.i18n.ts", "AccountLabels", 2],
  ["components/menu/top/top-menu.i18n.ts", "TopMenuUi", 2],
  ["app/[lang]/_components/cookie-banner/cookie-banner.i18n.ts", "BannerStrings", 2],
  ["components/menu/footer/cookie-settings-button.i18n.ts", "CookieButtonUi", 2],
  // 🔒 СЛОВАРИ МОДАЛЬНЫХ ОКОН (внесены 2026-08-17 вместе с единым примитивом).
  // Два из трёх УЖЕ стояли вне охраны: сторож проверяет только то, что ему
  // назвали, а назвать их забыли. С того дня регистрация нового окна в этом
  // списке — часть того же коммита, что и само окно.
  ["components/dialog/app-dialog.i18n.ts", "AppDialogUi", 2],
  ["components/auth/access-gate.i18n.ts", "AccessGateUi", 2],
  // Слова публичного каталога и подписи движка материалов.
  ["lib/content/page-ui.ts", "PageUi", 2],
  ["lib/content/post-body-ui.ts", "PostBodyUi", 2],
  // Кнопка в подвале и кнопка на главной, ведущие на страницу архитектуры.
  ["lib/i18n/architecture-link.i18n.ts", "ArchitectureLinkUi", 2],
  // Каталог секций.
  ["app/[lang]/(architectLayer)/architect/blocks/page-material/_data/ui.i18n.ts", "BlocksCatalogueUi", 2],
  // Слова СЛОЯ АРХИТЕКТОРА (236-1). ✗ До того шага сторож их не проверял вовсе:
  // словарь существовал с 230-4 и в списке отсутствовал, поэтому прибор оставался
  // зелёным, когда из словаря НАМЕРЕННО убрали русский ключ. Зелёный цвет означал
  // не порядок, а то, что сюда не смотрели.
  ["app/[lang]/(architectLayer)/_i18n/architect-layer.i18n.ts", "ArchitectLayerUi", 2],
  // 🛑 ВНЕСЁН В ТОТ ЖЕ ШАГ, ЧТО И САМ СЛОВАРЬ (244-2), — И ЭТО НЕ АККУРАТНОСТЬ, А
  // ЗАКОН, ОПЛАЧЕННЫЙ В 236-1: прибор со списком проверяемого МОЛЧИТ о том, чего
  // в списке нет.
  ["app/[lang]/(architectLayer)/_i18n/architect-home.i18n.ts", "ArchitectHomeUi", 2],
  // Вкладка «GitHub» слоя архитектора (273) — внесена тем же коммитом, что и словарь.
  ["app/[lang]/(architectLayer)/architect/build/github/_github/words/github.i18n.ts", "GithubWords", 2],
  // 🪦 ЗДЕСЬ СТОЯЛ `architect-build.i18n.ts` — словарь макета из трёх разделов,
  // удалён в 254 вместе с самим макетом.
  // 🪦 ДЕВЯТЬ ТОВАРНЫХ СЛОВАРЕЙ УДАЛЕНЫ ВМЕСТЕ С МАГАЗИНОМ (230-3, 2026-09-18).
  // Страницы четырёх слоёв прав.
  ["app/[lang]/(protectedLayer)/(admin)/administration/users/_data/ui.i18n.ts", "AdministrationUsersUi", 2],
  ["app/[lang]/(protectedLayer)/(admin)/administration/users/_widgets/dynamic/users-table/ui.i18n.ts", "UsersTableUi", 2],
]
/**
 * ВТОРАЯ ФОРМА СЛОВАРЯ — ЯЗЫКОВЫЕ ЯЧЕЙКИ (шаг 508).
 *
 * 🔒 ЗАЧЕМ ОТДЕЛЬНЫЙ СПИСОК. Публичные поверхности хранят слова не одним файлом
 * с картой языков, а ПАПКОЙ: `_data/en.ts`, `ru.ts`, … — по файлу на язык, как
 * у поста блога. Сторож, знающий только первую форму, такие словари не видел
 * вовсе: у индекса блога и у каталога не проверялся НИ ОДИН ключ, и пропущенная
 * строка в девятом языке доехала бы до клиента.
 *
 * [папка, файл типа, имя типа, сколько языков]
 */
const CELLS = [
]

// ── Третья форма: СТРАНИЦЫ-ПАПКИ КОЛЛЕКЦИИ (254) ───────────────────────────
//
// 🔒 ПОЧЕМУ ЗДЕСЬ НЕТ СПИСКА, И ЭТО НЕ ОТСТУПЛЕНИЕ ОТ ПРАВИЛА ФАЙЛА. Шапка выше
// говорит: список ведётся руками намеренно, чтобы новый словарь попадал под
// охрану осознанно. Для страниц слоя это правило дало бы ровно тот отказ, от
// которого оно защищает: страница добавляется ПАПКОЙ, без единой правки общих
// файлов, — значит её словарь никто и никогда не впишет сюда, и прибор останется
// зелёным над непроверенными двадцатью тремя папками.
//
// Поэтому здесь список не ведётся, а ВЫВОДИТСЯ: под охрану попадает всё, что
// сканер считает страницей, — то же правило, по которому строятся меню и
// рубрикаторы. Разойтись охране и дереву негде.
//
// 🛑 ЧТО ИМЕННО ПРОВЕРЯЕТСЯ: у каждой страницы-папки есть `en.ts` (база, без неё
// падать некуда) и `ru.ts`, и в обоих есть `title` — имя, которым страница
// зовётся в меню, в рубрикаторе и в своём заголовке. Пустое имя не ломает ни
// типы, ни сборку: в меню просто появляется пункт без подписи.
const COLLECTION_ROOTS = ["app/[lang]/(architectLayer)/architect"]
const COLLECTION_LANGS = enabledLanguages()

function collectionPages(dir, found = []) {
  if (!fs.existsSync(dir)) return found
  for (const name of fs.readdirSync(dir)) {
    if (/^[_[(.]/.test(name)) continue
    const child = `${dir}/${name}`
    if (!fs.statSync(child).isDirectory()) continue
    if (fs.existsSync(`${child}/_data/index.ts`)) found.push(child)
    collectionPages(child, found)
  }
  return found
}

// 🔒 ЦИФРЫ В ИМЕНИ КЛЮЧА ОБЯЗАТЕЛЬНЫ В ШАБЛОНЕ. `step1`, `step2` — обычные
// имена, а шаблон без цифр молча терял их и объявлял неполный словарь полным:
// проверка, пропускающая часть ключей, опаснее отсутствующей.
const KEY_RE = /^ {2}([a-zA-Z][a-zA-Z0-9]*)\??:/gm
const LANG_RE = /^ {2}([a-z]{2,3}(?:-[A-Za-z]+)?): \{/gm

// 🔒 ОЖИДАЕМОЕ ЧИСЛО ЯЗЫКОВ БЕРЁТСЯ У ВКЛЮЧЁННОГО НАБОРА, А НЕ ИЗ СПИСКА (256-9).
//
// ✗ ИЗМЕРЕНО 2026-09-20, И ЭТО БЫЛА ТИХАЯ ДЫРА. После шага 255 у каждого словаря
// в списке выше стояло число `2`. Прогон с третьим включённым языком:
//
//   $ NEXT_PUBLIC_SUPPORTED_LANGUAGES=en,ru,es node scripts/check-i18n.mjs
//   ===I18N_OK=== все словари полны        (код возврата 0)
//
// То есть прибор объявлял порядок в тот момент, когда верхнее меню, согласие на
// cookie, замок доступа и модальные окна остались бы английскими на всём
// испанском сайте. Число описывало НЕ ТО, ЧТО МЕНЯЕТСЯ.
//
// 🔒 ТЕПЕРЬ ОТВЕЧАЕТ ВКЛЮЧЁННЫЙ НАБОР, А ЧИСЛО В СПИСКЕ ОСТАЁТСЯ ЗАПИСЬЮ О ТОМ,
// СКОЛЬКО ОБЕЩАНО. Словарь обязан нести ровно столько языков, сколько включено:
// меньше — интерфейс говорит не на языке страницы, больше — лежит перевод без
// адреса.
//
// ✗ ПЕРВАЯ РЕДАКЦИЯ ЭТОЙ ЖЕ ПРАВКИ БЫЛА НЕВЕРНОЙ, И ЭТО ПОЙМАНО ПРОГОНОМ: там
// стоял `Math.min(declared, ENABLED.length)`, то есть при двух объявленных и трёх
// включённых ожидалось по-прежнему два — дыра сохранялась в точности. Направление
// у ограничения было перевёрнуто.
function enabledLanguages() {
  const fromEnv = process.env.NEXT_PUBLIC_SUPPORTED_LANGUAGES?.trim()
  if (fromEnv) return fromEnv.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
  for (const name of [".env.local", ".env"]) {
    try {
      const line = fs.readFileSync(name, "utf8")
        .split(/\r?\n/)
        .find(l => l.trim().startsWith("NEXT_PUBLIC_SUPPORTED_LANGUAGES="))
      if (line) return line.slice(line.indexOf("=") + 1).split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
    } catch { /* нет файла — идём дальше */ }
  }
  return []
}

const ENABLED = enabledLanguages()
const expected = declared => (ENABLED.length ? ENABLED.length : declared)

console.log(`включено языков: ${ENABLED.join(",") || "(не задано)"}\n`)

let bad = 0
for (const [file, type, want] of FILES) {
  if (!fs.existsSync(file)) {
    console.log(`  НЕТ ФАЙЛА  ${file}`)
    bad++
    continue
  }
  const src = fs.readFileSync(file, "utf8")

  const typeBlock = src.match(new RegExp(`export type ${type} = \\{([\\s\\S]*?)\\n\\}`))
  const keys = typeBlock ? [...typeBlock[1].matchAll(KEY_RE)].map(m => m[1]) : []

  // 🔒 СЛОВАРЬ МОЖЕТ ЖИТЬ В JSON РЯДОМ (владелец 2026-08-14). Переводы делает
  // внешняя модель и возвращает их файлом, поэтому слова уехали из кода в
  // `<имя>.json`, а тип остался здесь и по-прежнему решает всё. Сторож обязан
  // знать оба вида: иначе переезд словаря читается как «языков 0» — то есть
  // проверка объявляет поломкой ровно то, ради чего её и держат.
  const jsonPath = file.replace(/\.ts$/, ".json")
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"))
    const langs = Object.keys(data)
    const holes = []
    for (const lang of langs) {
      for (const k of keys) {
        const v = data[lang]?.[k]
        if (typeof v !== "string" || !v.trim()) holes.push(`${lang}.${k}`)
      }
    }
    const ok = langs.length === expected(want) && keys.length > 0 && holes.length === 0
    if (!ok) bad++
    let line = `${ok ? "  OK   " : "  БЕДА "} ${file}\n         языков ${langs.length}/${expected(want)}, ключей ${keys.length} (слова в ${jsonPath.split("/").pop()})`
    if (!keys.length) line += " — ТИП НЕ РАЗОБРАН"
    if (holes.length) {
      line += `\n         не хватает: ${holes.slice(0, 8).join(", ")}`
      if (holes.length > 8) line += ` (+${holes.length - 8})`
    }
    console.log(line)
    continue
  }

  // Языковая запись читается СЧЁТОМ СКОБОК, а не строкой: словари бывают в двух
  // видах — однострочном (`  fr: { … },`) и многострочном, и проверка, знающая
  // только один из них, объявляет второй сломанным. Это уже случилось.
  const langs = []
  const entries = []
  for (const m of src.matchAll(LANG_RE)) {
    const start = m.index + m[0].length - 1 // на открывающей `{`
    let depth = 0
    let q = null
    let end = start
    for (let i = start; i < src.length; i++) {
      const ch = src[i]
      if (q) {
        if (ch === "\\") i++
        else if (ch === q) q = null
        continue
      }
      if (ch === "'" || ch === '"' || ch === "`") { q = ch; continue }
      if (ch === "{") depth++
      else if (ch === "}") { depth--; if (depth === 0) { end = i; break } }
    }
    langs.push(m[1])
    entries.push([m[1], src.slice(start, end + 1)])
  }

  const holes = []
  for (const [lang, body] of entries) {
    for (const k of keys) {
      if (!new RegExp(`[{,]\\s*${k}:`).test(body)) holes.push(`${lang}.${k}`)
    }
  }

  const ok = langs.length === expected(want) && keys.length > 0 && holes.length === 0
  if (!ok) bad++
  const head = ok ? "  OK   " : "  БЕДА "
  let line = `${head} ${file}\n         языков ${langs.length}/${expected(want)}, ключей ${keys.length}`
  if (!keys.length) line += " — ТИП НЕ РАЗОБРАН"
  if (holes.length) {
    line += `\n         не хватает: ${holes.slice(0, 8).join(", ")}`
    if (holes.length > 8) line += ` (+${holes.length - 8})`
  }
  console.log(line)
}

// ── Вторая форма: языковые ячейки ──────────────────────────────────────────
for (const [dir, typeFile, type, want] of CELLS) {
  if (!fs.existsSync(dir) || !fs.existsSync(typeFile)) {
    console.log(`  НЕТ ПАПКИ  ${dir}`)
    bad++
    continue
  }
  const typeSrc = fs.readFileSync(typeFile, "utf8")
  const block = typeSrc.match(new RegExp(`export type ${type} = \\{([\\s\\S]*?)\\n\\}`))
  const keys = block ? [...block[1].matchAll(KEY_RE)].map(m => m[1]) : []
  const cells = fs.readdirSync(dir).filter(f => /^[a-z]{2}\.ts$/.test(f)).map(f => f.replace(".ts", ""))

  const holes = []
  for (const lang of cells) {
    const body = fs.readFileSync(`${dir}/${lang}.ts`, "utf8")
    for (const k of keys) {
      if (!new RegExp(`[{,\\s]${k}:`).test(body)) holes.push(`${lang}.${k}`)
    }
  }

  const ok = cells.length === want && keys.length > 0 && holes.length === 0
  if (!ok) bad++
  let line = `${ok ? "  OK   " : "  БЕДА "} ${dir}/\n         языков ${cells.length}/${want}, ключей ${keys.length} (ячейки)`
  if (!keys.length) line += " — ТИП НЕ РАЗОБРАН"
  if (holes.length) {
    line += `\n         не хватает: ${holes.slice(0, 8).join(", ")}`
    if (holes.length > 8) line += ` (+${holes.length - 8})`
  }
  console.log(line)
}

// ── Третья форма: страницы-папки коллекции ─────────────────────────────────
let pagesChecked = 0
const pageHoles = []
for (const root of COLLECTION_ROOTS) {
  for (const dir of collectionPages(root)) {
    pagesChecked++
    const where = dir.replace(/^app\/\[lang\]\/\([^)]*\)\//, "")
    for (const lang of COLLECTION_LANGS) {
      const file = `${dir}/_data/${lang}.ts`
      if (!fs.existsSync(file)) { pageHoles.push(`${where}: нет ${lang}.ts`); continue }
      const body = fs.readFileSync(file, "utf8")
      const title = body.match(/title:\s*'([^']*)'/)?.[1]
      if (!title || !title.trim()) pageHoles.push(`${where}: ${lang} без title — пункт меню будет без подписи`)
    }
  }
}
if (pageHoles.length) bad += pageHoles.length
console.log(`  ${pageHoles.length ? "БЕДА " : "OK   "} страницы-папки слоя: ${pagesChecked}, языков ${COLLECTION_LANGS.join("+")}`)
for (const h of pageHoles.slice(0, 10)) console.log(`         ${h}`)
if (pageHoles.length > 10) console.log(`         (+${pageHoles.length - 10})`)

console.log(bad ? `\n===I18N_FAILED=== проблемных словарей: ${bad}` : "\n===I18N_OK=== все словари полны")
process.exit(bad ? 1 : 0)
