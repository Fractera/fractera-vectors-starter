#!/usr/bin/env node
// npm run check:content — mechanical gate for every co-located content post.
//
// 🔒 WHY THIS EXISTS. The two posts this project ships were repaired by hand
// once: their links were relative (dead on any site that is not the platform's
// own), their hero media was missing from `public/`, one of them had no Russian
// cell at all, and the site name was written into the data. Repairing the two
// posts fixes nothing durable — the owner may never touch them again, while
// every NEW post repeats the same four mistakes, silently, and each one ships.
//
// So the rules live here, as a check that FAILS the build instead of a
// paragraph nobody re-reads. A rule that is not mechanically enforced is a
// suggestion, and suggestions lose to deadlines.
//
// Scope: any folder under app/[lang]/<section>/<slug>/_data. Adding a section
// (news, docs) needs no change here — the walk finds it.

import { isForeign } from './microservices-boundary.mjs'
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs"
import { join, relative, sep, basename } from "node:path"

const ROOT = process.cwd()
const APP = join(ROOT, "app", "[lang]")
const PUBLIC = join(ROOT, "public")

const problems = []
const fail = (file, rule, detail) => problems.push({ file: relative(ROOT, file), rule, detail })

// ── ПОКРЫТИЕ ЯЗЫКОВ — ПРЕДУПРЕЖДЕНИЕ ЗДЕСЬ И ОТКАЗ ПРИ `--strict` ───────────
//
// 🔒 ЗАЧЕМ ПРАВИЛО. На живом сайте включено десять языков, а ячеек у постов было
// две: восемь адресов отдавали английский текст, объявляя себя переводом —
// `hreflang` называл их переводами, карта сайта их перечисляла, а разметка
// писала `inLanguage: es` над английской статьёй. Ни один гейт этого не видел:
// правило знало «нет НИ ОДНОГО перевода» и не знало «нет ячейки для языка,
// который владелец ВКЛЮЧИЛ».
//
// 🔒 ПОЧЕМУ НЕ РОНЯЕТ СБОРКУ. Остальные правила ловят структурные дефекты —
// динамику, битую ссылку, некоммитнутую картинку; их чинит тот, кто их внёс, за
// минуту. Отсутствующий перевод — это ненаписанная проза, и уронить ею сборку
// значит погасить работающий сайт клиента в ту минуту, когда он в панели включил
// новый язык. Поэтому в сборке это громкое предупреждение, а в ручном прогоне
// (`npm run check:content`, флаг `--strict`) — отказ.
const warnings = []
const warn = (file, rule, detail) => warnings.push({ file: relative(ROOT, file), rule, detail })
const STRICT = process.argv.includes("--strict")

// Реестр долга читается ОДИН раз: его спрашивает каждая непереведённая папка.
const DEBT_FILE = "development-docs/TRANSLATION-DEBT.md"
const DEBT_TEXT = (() => {
  try {
    return readFileSync(join(ROOT, DEBT_FILE), "utf8")
  } catch {
    return ""
  }
})()

/**
 * Языки, включённые в сборку проекта. Сначала окружение (на сервере значение
 * приходит именно оттуда), затем `.env.local` — тот же порядок, в котором его
 * читает сам Next.
 */
function enabledLanguages() {
  const fromEnv = process.env.NEXT_PUBLIC_SUPPORTED_LANGUAGES?.trim()
  if (fromEnv) return fromEnv.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
  for (const name of [".env.local", ".env"]) {
    try {
      const line = readFileSync(join(ROOT, name), "utf8")
        .split(/\r?\n/)
        .find(l => l.trim().startsWith("NEXT_PUBLIC_SUPPORTED_LANGUAGES="))
      if (!line) continue
      return line.slice(line.indexOf("=") + 1).split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
    } catch { /* нет файла — идём дальше */ }
  }
  return []
}

// 🔒 ПРОВЕРЯЕТСЯ ТОЛЬКО ПУБЛИЧНЫЙ СЛОЙ, И ОН НАЗВАН ЯВНО (шаг 508).
//
// Эти правила описывают ПУБЛИЧНЫЙ контент: страницу, одинаковую для всех,
// предрендеренную и индексируемую. У страницы за авторизацией законны и
// клиентский островок, и динамический сегмент — там иначе нельзя, и проверка,
// зашедшая туда, объявила бы нарушением ровно то, что тот слой обязан делать.
//
// 🔒 БЕЛЫЙ СПИСОК ВМЕСТО ЧЁРНОГО. Раньше обход брал ВСЁ под `[lang]` и вычитал
// `(protectedLayer)` по имени. Разница не в стиле: при вычитании новая папка,
// заведённая завтра, МОЛЧА считается публичным контентом и проверяется правилами,
// которые к ней могут не подходить, — а публичная поверхность, оказавшаяся вне
// обхода, не проверяется ничем. При белом списке всё, что не попало ни в одну
// группу, — состояние «не классифицировано», и его видно.
//
// Граница описана в `CLAUDE.md`, раздел «What goes on a page» — три модели страницы.
const PUBLIC_GROUP = "(publicLayer)"

/** Каждая папка `_data` внутри публичного слоя, на любой глубине. */
function findDataDirs(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (!statSync(p).isDirectory()) continue
    if (name === "_data") out.push(p)
    else out.push(...findDataDirs(p, out).slice(out.length))
  }
  return out
}

/**
 * Маршрут, не попавший ни в публичную группу, ни в защищённую, — это НЕ «прочее»,
 * а незаданный вопрос: одинакова ли эта страница для всех? От ответа зависит,
 * статикой она рендерится или за авторизацией. Пока ответа нет, её не проверяет
 * никто, и заметить это можно только специально.
 */
function unclassifiedRoutes(langDir) {
  const KNOWN = new Set([PUBLIC_GROUP, "(protectedLayer)"])
  const out = []
  if (!existsSync(langDir)) return out
  for (const name of readdirSync(langDir)) {
    if (KNOWN.has(name) || name.startsWith("_") || name.startsWith("[")) continue
    const p = join(langDir, name)
    if (!statSync(p).isDirectory()) continue
    // Папка-маршрут опознаётся по `page.tsx`; служебные (`index.md`, `llms.txt`)
    // страницами не являются и в классификации не нуждаются.
    if (existsSync(join(p, "page.tsx"))) out.push(name)
  }
  return out
}

// ── RULE 1 — a post knows exactly TWO kinds of link ─────────────────────────
//
// EXTERNAL — always absolute, with a host. A relative link is a promise about
// the site it lands on, and a post travels into projects that have no such
// page: `/ai-development-loop` returned 404 on every customer site.
//
// INTERNAL ROOT — the only relative link allowed, written `[%SITE%](/ru)`. It
// points at the home page in the language of that data cell, and its label is
// the site's own title. This is how an article natively pushes weight to the
// home page without anyone's name being typed into the text.
//
// Anything else relative is rejected.
// Подпись и адрес не переносятся на новую строку — иначе выражение цепляет
// открывающую скобку массива `blocks: [` и «ссылкой» становится вся статья.
const LINK_IN_TEXT = /\[([^\]\n]+)\]\(([^)\n]+)\)/g
const HREF_FIELD = /href:\s*'([^']+)'|href:\s*"([^"]+)"/g
const ROOT_LINK = /^\/[a-z]{2}$/

// 🔒 ТРЕТЬЯ ЗАКОННАЯ ФОРМА — СЕРВЕРНАЯ ПОДСТАНОВКА `{admin}` (шаг 508).
// Адрес панели управления у каждого проекта свой и появляется только после того,
// как владелец сохранил настройки. Вписать его в языковую ячейку нельзя — он
// уехал бы во все остальные проекты вместе с шаблоном. Поэтому в данных стоит
// метка, а раскрывает её страница; панели нет — ссылка вырезается вместе с
// подписью, а не ведёт в никуда. Для проверки это АБСОЛЮТНЫЙ адрес:
// относительным он не бывает ни при каком исходе.
const ADMIN_LINK = /^\{admin\}/

// 🔒 ЧЕТВЁРТАЯ ЗАКОННАЯ ФОРМА — ССЫЛКА НА СВОЮ ЖЕ СТРАНИЦУ (2026-08-21).
//
// До неё внутренней ссылкой был только корень, то есть ПЕРЕЛИНКОВКИ в движке не
// существовало: сослаться из статьи на другую страницу сайта было нечем.
// Запрет относительных ссылок при этом остаётся — он написан по настоящей
// причине (материал путешествует между проектами), поэтому форма разрешена не
// молча: адрес обязан вести на СУЩЕСТВУЮЩИЙ здесь маршрут, и это проверяется
// ниже обходом дерева. Ссылка в никуда должна падать на сборке у того, кто её
// принёс, а не открываться посетителю.
const PAGE_LINK = /^\/[a-z]{2}(\/[a-z0-9][a-z0-9/-]*)$/

/**
 * Публичные адреса проекта без языка: `/about-us`, `/blog`, `/blog/<slug>`.
 *
 * 🔒 ОБХОД ИДЁТ ТОЛЬКО ПО ПУБЛИЧНОМУ СЛОЮ. Страницы за ролью адресами для ссылки
 * не являются: публичная ссылка, ведущая на 403, — обещание, которого сайт не
 * сдержит. Проверено при заведении правила: первый обход собирал и
 * `/administration/products`, и `/shopping/products`, то есть разрешал сослаться
 * из статьи в чужой кабинет.
 */
function publicPaths() {
  const out = new Set()
  const walk = (dir, prefix) => {
    let entries = []
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith("_") || e.name.startsWith("[")) continue
      // Скобочная группа на адрес не влияет — заглядываем внутрь, не удлиняя путь.
      const grouped = e.name.startsWith("(") && e.name.endsWith(")")
      // Папки машинных маршрутов (`index.md`, `llms.txt`) страницами не являются.
      if (!grouped && e.name.includes(".")) continue
      const next = grouped ? prefix : `${prefix}/${e.name}`
      if (!grouped && existsSync(join(dir, e.name, "page.tsx"))) out.add(next)
      walk(join(dir, e.name), next)
    }
  }
  // `APP` УЖЕ равен `app/[lang]` — добавлять сегмент второй раз значит обходить
  // несуществующую папку и получить пустое множество. Первый прогон правила
  // отверг ссылку на существующий `/blog` именно поэтому: пустое множество
  // выглядит как «такой страницы нет».
  walk(join(APP, PUBLIC_GROUP), "")

  // 🛑 СЛОЙ АРХИТЕКТОРА ТОЖЕ ДАЁТ АДРЕСА, НА КОТОРЫЕ МОЖНО ССЫЛАТЬСЯ (2026-09-19).
  // ✗ оплачено: главная получила кнопку на `/{lang}/architect/build/subscription`
  // — страница существует и отдаёт 200, — а сторож объявил ссылку мёртвой, потому
  // что обходил только публичную группу. Ложное срабатывание есть худший род
  // отказа прибора: оно учит обходить проверку вместо того, чтобы её исполнять.
  //
  // 🔒 СТРАНИЦЫ СЛОЯ ЗАКРЫТЫ ЗАМКОМ, И ДЛЯ ССЫЛКИ ЭТО НИЧЕГО НЕ МЕНЯЕТ. Правило
  // спрашивает «существует ли маршрут», а не «пустят ли туда каждого»: ссылка на
  // защищённую страницу законна — человек увидит замок, а не 404. Приватный слой
  // (`(protectedLayer)`) сюда по-прежнему НЕ входит: там маршрут зависит от того,
  // кто смотрит, и само его существование ничего не обещает.
  walk(join(APP, "(architectLayer)"), "")
  return out
}
const PUBLIC_PATHS = publicPaths()

// Pages of the architect live in the node's CORE, not in this site (280): the site answers
// /<lang>/architect/* with a redirect to the core's address (next.config.ts). A link there is
// a link to a sibling element of the node, so its page is not expected in this project.
const isCorePath = (p) => p === '/architect' || p.startsWith('/architect/')

// ── RULE 2 — every local asset exists ───────────────────────────────────────
// `heroVideo`, `heroPoster`, `src:` pointing at `/something` must resolve to a
// file in public/. The hero of a shipped post pointed at a video that was never
// copied: the pattern arrived broken and nobody noticed until it was opened.
const LOCAL_ASSET = /(?:heroVideo|heroPoster|src):\s*'(\/[^']+)'|(?:heroVideo|heroPoster|src):\s*"(\/[^"]+)"/g

// ── RULE 3 — the site never names itself in content ─────────────────────────
// The blog's own data carried 'Blog | Fractera' and 'Fractera Blog', so every
// customer's blog introduced itself with the platform's name. Identity comes
// from APP-CONFIG at render time; data may not carry it.
const BRAND_LITERALS = [/'[^']*\|\s*Fractera'/i, /'Fractera\s+(Blog|News|Docs)'/i]

// ── RULE 4 — a declared language cell exists ────────────────────────────────
// `_data/index.ts` lists the overrides; a listed language whose file is missing
// is a build error, and a post with NO overrides silently serves English on
// every language. The second is legal but must be a decision, not an oversight,
// so it is reported as a notice rather than a failure.
function checkPost(dataDir) {
  const files = readdirSync(dataDir).filter(f => f.endsWith(".ts"))
  const indexPath = join(dataDir, "index.ts")
  if (!files.includes("index.ts")) return

  // Папка данных РАЗДЕЛА (строки интерфейса индекса) отличается от папки данных
  // ПОСТА наличием `meta.ts`. Правила про переводы и ссылку на корень —
  // про пост: у раздела нет ни автора, ни тела статьи.
  const isPost = files.includes("meta.ts")
  /** Ссылок на корень В КАЖДОМ файле по отдельности (см. правило 5 ниже). */
  const rootLinksIn = new Map()

  for (const f of files) {
    const p = join(dataDir, f)
    const text = readFileSync(p, "utf8")

    for (const m of text.matchAll(LINK_IN_TEXT)) {
      const label = m[1].trim()
      const href = m[2].trim()
      if (ROOT_LINK.test(href)) {
        rootLinksIn.set(f, (rootLinksIn.get(f) ?? 0) + 1)
        if (label !== "%SITE%") {
          fail(p, "root-link-label", `[${label}](${href}) — подпись внутренней ссылки на корень обязана быть %SITE%: она подставляется названием сайта из настроек`)
        }
        continue
      }
      if (ADMIN_LINK.test(href)) continue
      const page = href.match(PAGE_LINK)
      if (page) {
        if (!PUBLIC_PATHS.has(page[1]) && !isCorePath(page[1])) {
          fail(p, "page-link-missing", `[…](${href}) — в этом проекте нет страницы ${page[1]}; ссылка на свою страницу обязана вести на существующий маршрут`)
        }
        continue
      }
      if (!/^https?:\/\//.test(href) && !href.startsWith("#") && !href.startsWith("mailto:")) {
        fail(p, "link-not-absolute", `[…](${href}) — относительная ссылка; законны две внутренние формы: [%SITE%](/${"<язык>"}) и [подпись](/${"<язык>/<страница>"})`)
      }
    }
    for (const m of text.matchAll(HREF_FIELD)) {
      const href = (m[1] ?? m[2]).trim()
      // Корневая форма разрешена и в полях `href` — у блока-кнопки (`cta`) и у
      // ссылки на иллюстрации (шаг 507. Прежде поле принимало ТОЛЬКО абсолютный
      // адрес, поэтому единственной законной целью кнопки был чужой сайт: обе
      // посланные со стартером статьи вели ею на домен платформы. Кнопка,
      // которой некуда указать внутри собственного сайта, — это дефект правила,
      // а не выбор автора.)
      if (ROOT_LINK.test(href)) continue
      if (ADMIN_LINK.test(href)) continue
      const hrefPage = href.match(PAGE_LINK)
      if (hrefPage) {
        if (!PUBLIC_PATHS.has(hrefPage[1]) && !isCorePath(hrefPage[1])) {
          fail(p, "page-link-missing", `href: '${href}' — в этом проекте нет страницы ${hrefPage[1]}`)
        }
        continue
      }
      if (!/^https?:\/\//.test(href) && !href.startsWith("#") && !href.startsWith("mailto:")) {
        fail(p, "link-not-absolute", `href: '${href}' — относительная ссылка; внутри сайта законны '/<язык>' и '/<язык>/<страница>'`)
      }
    }
    for (const m of text.matchAll(LOCAL_ASSET)) {
      const rel = (m[1] ?? m[2]).trim()
      if (!existsSync(join(PUBLIC, rel))) {
        fail(p, "asset-missing", `${rel} — файла нет в public/`)
      }
    }
    for (const re of BRAND_LITERALS) {
      const hit = text.match(re)
      if (hit) fail(p, "brand-in-data", `${hit[0]} — имя сайта берётся из APP-CONFIG, не из данных`)
    }
  }

  // Language cells declared in index.ts must exist as files.
  const index = readFileSync(indexPath, "utf8")
  for (const m of index.matchAll(/import\s*\{\s*(\w+)\s*\}\s*from\s*'\.\/(\w+)'/g)) {
    const file = `${m[2]}.ts`
    if (!files.includes(file)) fail(indexPath, "cell-missing", `объявлен ${file}, файла нет`)
  }
  if (isPost && !/overrides\s*:/.test(index)) {
    fail(indexPath, "single-language", "нет ни одного перевода — пост будет английским на всех языках")
  }

  // Ячейка на КАЖДЫЙ включённый язык — иначе адрес объявляет себя переводом,
  // а отдаёт язык-основу (см. пояснение у `warn` в начале файла).
  const cells = new Set(languageCells(files).map(f => f.replace(".ts", "")))
  const missing = LANGS.filter(l => !cells.has(l))
  if (missing.length > 0) {
    const say = LANGS.length > 0 ? `включено ${LANGS.length}, нет ячеек: ${missing.join(", ")}` : ""
    ;(STRICT ? fail : warn)(dataDir, "translation-coverage", `${say} — эти адреса отдадут язык-основу, объявляя себя переводом`)

    // 🔒 НЕПЕРЕВЕДЁННАЯ ПАПКА ОБЯЗАНА БЫТЬ НАЗВАНА В РЕЕСТРЕ ДОЛГА (256-10).
    //
    // Решение владельца 2026-09-20: «разработка ведётся на языке по дефолту,
    // сразу же… ссылка на него попадает в специальный документ долги по
    // переводам. Затем отдельно модель запускается с требованием пройти по всем
    // ссылкам и добавить перевод».
    //
    // 🪦 «ЭТО ОТКАЗ, А НЕ ПРЕДУПРЕЖДЕНИЕ» ОТМЕНЕНО ВЛАДЕЛЬЦЕМ 2026-10-05 (шаг 397 узла: «y , for root and for all»).
    // Здесь стояло: незаписанный долг роняет сборку, потому что «дописать строку стоит десяти секунд». Это верно для
    // агента, добавляющего страницу, и неверно для человека, который включает язык в пульте: на сайте из N страниц
    // это N отказов, и элемент нельзя пересобрать ни по какой причине. ✗ root узла простоял так 4 дня (fr с
    // 2026-10-01), и никто не видел: сайт отвечал прежней сборкой. Теперь при сборке это предупреждение, отказ —
    // только в `--strict`, как у строки выше. Долг не теряется: этот обход печатает каждую папку на каждой сборке.
    //
    // 🔒 СВЕРЯЕТСЯ ОБХОДОМ, А НЕ ДОВЕРИЕМ. Рукописный реестр расходится с деревом
    // молча — это 236-1, оплаченное дважды. Здесь дерево спрашивает реестр само.
    const relDir = relative(ROOT, dataDir).split(sep).join("/")
    if (!DEBT_TEXT.includes(relDir)) {
      ;(STRICT ? fail : warn)(dataDir, "debt-not-registered", `перевода нет (${missing.join(", ")}), а папка не названа в ${DEBT_FILE}`)
    }
  }

  // ── RULE 5 — каждый пост тянет вес на главную ─────────────────────────────
  // Внешние ссылки отдают вес наружу. Если статья не ссылается на собственную
  // главную, сайт раздаёт и не получает. Одна ссылка на корень — минимум, и
  // она обязана быть в КАЖДОЙ языковой ячейке, иначе половина сайта немая.
  //
  // 🔒 СЧИТАЕМ ПОФАЙЛОВО, А НЕ СУММОЙ (шаг 507). Здесь стояло сравнение общего
  // числа ссылок с числом ячеек: две ссылки в `en.ts` и НОЛЬ в `ru.ts` давали
  // «2 ≥ 2» и проходили. Проверка на сумму отвечает на вопрос «сколько всего»,
  // тогда как правило спрашивает «в каждой ли» — это разные вопросы, и второй
  // как раз тот, ради которого правило написано.
  // 🔒 ГЛАВНАЯ — ЭТО И ЕСТЬ КОРЕНЬ (шаг 508). Правило существует затем, чтобы
  // статьи тянули вес на главную. Требовать того же от самой главной значит
  // требовать ссылки страницы на саму себя: она ничего не даёт поисковику и
  // читается как ошибка вёрстки. Исключение по СМЫСЛУ, а не по удобству —
  // проверяется положением папки, а не списком имён.
  const isLanguageRoot = relative(join(APP, PUBLIC_GROUP), dataDir) === "_data"
  if (isPost && !isLanguageRoot) {
    for (const cell of languageCells(files)) {
      if (!rootLinksIn.get(cell)) {
        fail(join(dataDir, cell), "no-root-link", `нет внутренней ссылки на корень — нужна одна в этой языковой ячейке: [%SITE%](/${cell.replace(".ts", "")})`)
      }
    }
  }
}

/** Языковые ячейки папки данных: `en.ts`, `ru.ts`, … (не `meta.ts`, не `index.ts`). */
function languageCells(files) {
  return files.filter(f => /^[a-z]{2}\.ts$/.test(f))
}

// ── ВТОРОЙ ПРОХОД: АУДИТ АРХИТЕКТУРЫ ПОВЕРХНОСТИ ────────────────────────────
//
// Правила выше проверяют СОДЕРЖИМОЕ поста. Этот проход проверяет саму
// поверхность: осталась ли она статической, тонкой и самодостаточной. Семь
// требований, из которых пять проверяются здесь, а два — сборкой и живой
// страницей (их команды названы в навыке `use-static-pages` §8).
//
// Зачем в коде, а не в чек-листе: чек-лист исполняется, пока о нём помнят.
// Первая же правка «на минуту» вернёт `force-dynamic` в вкладку, и об этом
// узнают через месяц по просевшей выдаче.

// 🔒 `force-static` — ЭТО НЕ ДИНАМИКА, А ЕЁ ПРОТИВОПОЛОЖНОСТЬ (2026-08-13).
//
// Здесь стояло `export const dynamic\s*=` без разбора значения, и сторож объявлял
// нарушением ровно ту строку, которой добиваются: `export const dynamic =
// "force-static"` в markdown-версиях страниц (шаг 505). Гейт был красным шесть
// маршрутов подряд и оставался незамеченным, потому что в `prebuild` его нет.
//
// Красный гейт, который все привыкли игнорировать, хуже отсутствующего: он
// обесценивает и те проверки, что говорят правду.
const DYNAMIC_MARKERS = /force-dynamic|export const dynamic\s*=\s*["'](?!force-static)[^"']*["']|cookies\(\)|headers\(\)|auth\(\)/
const ENGINE_FILES = ["post-body", "registry", "resolve", "create-content-post", "create-content-page"]

/** Убрать комментарии, чтобы проверка смотрела на код, а не на объяснения к нему. */
// 🔒 СТРОЧНЫЕ СНИМАЮТСЯ ПЕРВЫМИ, И ПОРЯДОК — ВЕСЬ СМЫСЛ (найдено 2026-08-14).
// Обратный порядок ОСЛЕПЛЯЛ проверку: в строчном комментарии встречается адрес
// вида `/api/` со звёздочкой, эта пара открывает блочный комментарий, и снятие
// съедает НАСТОЯЩИЙ КОД до ближайшего закрытия. Сторож при этом молчит и
// выглядит зелёным — то есть ведёт себя как отсутствующий, не выглядя таковым.
// Поймано на соседнем правиле: макет с `cookies()` не срабатывал, потому что
// строкой выше стояло упоминание маршрутов API.
function stripComments(text) {
  return text.replace(/^[ \t]*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")
}

function walkFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walkFiles(p, out)
    else if (/\.(ts|tsx)$/.test(p)) out.push(p)
  }
  return out
}

/** Вкладка = папка под app/[lang] с постами (её _data-папки нашлись выше). */
function auditSurface(tabDir) {
  const files = walkFiles(tabDir)

  for (const f of files) {
    const text = readFileSync(f, "utf8")
    // 1 — никакой динамики.
    //
    // 🔒 ИЩЕМ В КОДЕ, А НЕ В КОММЕНТАРИЯХ (2026-08-12). Раньше проверялся весь
    // файл целиком, и сторож ловил собственное имя дефекта в объяснении, почему
    // так делать нельзя: строка «никакого force-dynamic» в комментарии считалась
    // нарушением. Сторож, запрещающий ГОВОРИТЬ о проблеме, заставляет писать
    // код без объяснений — а объяснение здесь ценнее самой проверки.
    const dyn = stripComments(text).match(DYNAMIC_MARKERS)
    if (dyn) fail(f, "surface-dynamic", `${dyn[0]} — публичная поверхность обязана оставаться статической`)
    // 2 — ни одного клиентского компонента
    if (/^["']use client["']/m.test(text)) fail(f, "surface-client", `"use client" — клиентский компонент во вкладке ломает работу без JS`)
  }

  // 3 — тонкий маршрут: page.tsx только реэкспортирует вход
  for (const f of files.filter(p => p.endsWith(`${sep}page.tsx`))) {
    const body = readFileSync(f, "utf8").split("\n").filter(l => l.trim() && !l.trim().startsWith("//"))
    if (body.length > 12) fail(f, "route-not-thin", `${body.length} строк — page.tsx обязан только реэкспортировать ./_components`)
  }

  // 4 — движок не продублирован во вкладке
  for (const f of files.filter(p => p.includes(`${sep}_lib${sep}`))) {
    const base = f.split(sep).pop().replace(/\.tsx?$/, "")
    if (ENGINE_FILES.includes(base)) fail(f, "engine-duplicated", `${base} — это файл общего движка; вкладка обязана его переиспользовать, а не копировать`)
  }

  // 5 — состав папки поста и отсутствие хвостов вне её
  for (const slug of readdirSync(tabDir)) {
    const postDir = join(tabDir, slug)
    // Папка `index.md/` — это МАШИННЫЙ МАРШРУТ раздела (markdown-версия страницы,
    // шаг 505), а не пост: внутри один `route.ts`, и требовать от неё `page.tsx`
    // с языковыми ячейками бессмысленно. Отличается по имени, а не по содержимому,
    // потому что имя папки здесь и есть адрес.
    if (!statSync(postDir).isDirectory() || slug.startsWith("_") || slug.startsWith("[") || slug.endsWith(".md")) continue
    for (const need of ["page.tsx", join("_components", "index.tsx"), join("_data", "index.ts")]) {
      if (!existsSync(join(postDir, need))) fail(postDir, "post-incomplete", `нет ${need}`)
    }
    // Ссылки на пост извне его папки допустимы ровно в одном файле — в
    // сгенерированном списке. Всё прочее означает, что удаление папки оставит
    // висящий импорт.
    //
    // 🔒 ИЩЕТСЯ ССЫЛКА, А НЕ СЛОВО, И НЕ В КОММЕНТАРИЯХ (исправлено 2026-08-21 по
    // прогону навыков). Здесь стояло `.includes(slug)` по сырому тексту файла, и
    // правило промахивалось дважды:
    //
    //   1. слуг из обычного английского слова красил гейт в красное на ПРОЗЕ
    //      соседей — страница `about` ловила каждое «about» в чужом абзаце, три
    //      ложных отказа подряд, и агент переименовал страницу, чтобы обойти
    //      сторожа. Обход сторожа — это и есть цена неверного правила;
    //   2. правило смотрело в КОММЕНТАРИИ, поэтому запрет «не читать запрос в
    //      маршруте» нельзя было объяснить дословно рядом с кодом: имя функции
    //      совпадает с именем соседней страницы подвала. Проверка, из-за которой
    //      объяснения пишут иносказанием, учит не писать их вовсе — тот же урок
    //      уже оплачен в `check-seo.mjs`.
    //
    // Хвост, ради которого правило существует, — это ССЫЛКА: импорт `../<slug>/…`
    // или адрес `/<язык>/<slug>`. Значит слагу предшествует разделитель пути или
    // кавычка, а следует за ним граница слова. Проза такой не бывает.
    const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const tail = new RegExp("[/'\"`]" + escaped + "(?![\\w-])")
    for (const f of files) {
      if (f.startsWith(postDir + sep) || f.endsWith("_list.generated.ts")) continue
      if (tail.test(stripComments(readFileSync(f, "utf8")))) {
        fail(f, "post-tail", `ссылается на «${slug}» вне его папки — удаление поста оставит хвост`)
      }
    }
  }
}

const LANGS = enabledLanguages()
const dirs = [...new Set(findDataDirs(join(APP, PUBLIC_GROUP)))]

// Маршрут вне обеих групп — не «прочее», а незаданный вопрос (см. выше).
for (const name of unclassifiedRoutes(APP)) {
  fail(join(APP, name), "route-unclassified", `маршрут не лежит ни в ${PUBLIC_GROUP}, ни в (protectedLayer) — не сказано, одинакова ли страница для всех, и потому её не проверяет ни один набор правил`)
}
for (const d of dirs) checkPost(d)

// Вкладка = папка, которой принадлежат посты. У ПОСТА данные лежат на два
// уровня ниже вкладки (`blog/<slug>/_data`), у самой вкладки — на один
// (`blog/_data`). Различаем по `meta.ts`: он есть только у поста.
//
// Область важна: считать вкладкой языковой корень `app/[lang]` значит
// проверять этими правилами весь публичный слой — там законно живут и
// клиентские островки, и толстая главная страница.
// 🔒 ВКЛАДКОЙ СЧИТАЕТСЯ ТОЛЬКО ТА, ЧЬИ ДАННЫЕ — ПОСТЫ. Папка `_data` бывает и у
// поверхностей другого рода: у публичной витрины каталога там лежат строки
// интерфейса, а сама она законно несёт клиентский островок догрузки. Первая
// версия проверки объявляла её нарушением — правило верное, область была не та.
//
// Признак поста — `_data/index.ts`, экспортирующий данные записи. Нет его —
// это не вкладка контента, и правила ко-локации постов к ней не относятся.
const postDataDirs = dirs.filter(d => existsSync(join(d, "index.ts")) && existsSync(join(d, "meta.ts")))
const surfaces = [...new Set(
  postDataDirs
    .map(d => join(d, "..", ".."))
    .filter(p => existsSync(p) && p !== APP && p.startsWith(APP + sep)),
)]
for (const s of surfaces) auditSurface(s)

// 🔒 ВЕСЬ ПУБЛИЧНЫЙ СЛОЙ, А НЕ ТОЛЬКО ВКЛАДКИ С ПОСТАМИ (найдено 2026-08-15).
//
// Проверка выше обходит поверхности, ВЫВЕДЕННЫЕ из папок постов: у раздела
// должны были найтись `_data/index.ts` и `_data/meta.ts`. Каталог товаров под
// это описание не подошёл — и `force-dynamic`, подложенный в него отрицательным
// контролем, прошёл молча.
//
// Дыра ровно того сорта, который этот файл и ловит у других: проверка выглядит
// работающей, потому что зелёная, а покрытия у неё нет. Здесь она была опаснее
// обычного — на статике держится стоимость сервера, и один динамический маршрут,
// добавленный «на минуту», обнаруживается по счёту, а не по экрану.
//
// Теперь обходится ВЕСЬ `(publicLayer)`: он и означает «одинаково для всех,
// статично, индексируется». Приватный слой сюда не входит намеренно — там
// динамика законна, страница зависит от того, кто смотрит.
// 🔒 ТОЛЬКО ПРОВЕРКА СТАТИКИ, А НЕ ВЕСЬ НАБОР ПРАВИЛ ВКЛАДКИ. Первая версия
// звала `auditSurface` на весь слой — и включила правила, рассчитанные на
// поверхность С ПОСТАМИ: «пост неполон», «хвост поста», «клиентский компонент во
// вкладке». Двадцать два срабатывания на законном коде, и сторож стал бы
// красным навсегда. Красный гейт, который привыкли игнорировать, хуже
// отсутствующего — это записано десятью строками выше и было забыто мной через
// пять минут после прочтения.
const PUBLIC_LAYER = join(APP, "(publicLayer)")
if (existsSync(PUBLIC_LAYER)) {
  for (const f of walkFiles(PUBLIC_LAYER)) {
    const dyn = stripComments(readFileSync(f, "utf8")).match(DYNAMIC_MARKERS)
    if (dyn) fail(f, "surface-dynamic", `${dyn[0]} — публичная поверхность обязана оставаться статической`)
  }
}

// ── ДВА ЯЗЫКА ВЕЗДЕ: ЛИШНИЙ ЯЗЫК — ОТКАЗ (шаг 255, 2026-09-20) ──────────────
//
// 🔒 РЕШЕНИЕ ВЛАДЕЛЬЦА, дословно: «у всех просто сейчас должен остаться русский и
// английский язык пройти по всему приложению… языки которые там существуют это
// чаще всего просто заглушки они мешают правильному поведению».
//
// 🔒 ПОЧЕМУ ЭТО ОТКАЗ, А НЕ ПРЕДУПРЕЖДЕНИЕ — В ОТЛИЧИЕ ОТ СОСЕДНЕГО ПРАВИЛА О
// ПОКРЫТИИ. Нет перевода — это ненаписанная проза, и ронять ею сборку клиента
// нельзя. Лишний язык — структурный мусор: ячейка выглядит переводом, не
// читается никем и расходится с живым текстом МОЛЧА. Именно это и случилось с
// восемью ячейками главной: они переводили страницу, снесённую шагом 245, и
// врали бы в тот день, когда владелец включит испанский.
//
// 🛑 ПРИЗНАК СЛОВАРЯ — НЕ `Record<string, …>`, А ТО, ЧТО **ВСЕ** КЛЮЧИ ЯВЛЯЮТСЯ
// КОДАМИ ЯЗЫКОВ. ✗ оплачено в этом же шаге: резак, доверившийся типу, обрезал
// `FONT_VAR` (имена шрифтов) и карту иконок соцсетей — объекты того же типа, не
// имеющие к языкам отношения.
//
// 🔒 КАТАЛОГ ЯЗЫКОВ ПРОДУКТА ИСКЛЮЧЁН, И ПРИЧИНА В ШАПКЕ, А НЕ В ГОЛОВЕ:
// `config/translations/language-metadata.ts` — это не перевод наших слов, а
// список языков, которые продукт УМЕЕТ включать. Обрезав его, мы удалили бы
// способность, а не заглушку.
const LANG_CATALOG = "config/translations/language-metadata.ts"
const ENABLED = new Set(enabledLanguages())

const catalogSrc = existsSync(join(ROOT, LANG_CATALOG)) ? readFileSync(join(ROOT, LANG_CATALOG), "utf8") : ""
const ALL_LANG_CODES = new Set([...catalogSrc.matchAll(/^ {2}([a-z]{2}): \{/gm)].map(m => m[1]))

/** Ячейка языка в `_data`: файл `<код>.ts` рядом с `index.ts`. */
function checkDataCells(dir) {
  for (const name of readdirSync(dir)) {
    // Граница чужого продукта — scripts/microservices-boundary.mjs.
    if (isForeign(name)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { checkDataCells(p); continue }
    if (basename(dir) !== "_data" || !/\.tsx?$/.test(name)) continue
    const code = name.replace(/\.tsx?$/, "")
    // 🪦 `lang-extra-cell` отменено тем же решением: ячейка выключенного языка
    // не порождает адреса и никуда не уезжает — это лежачий исходник, а не дефект.
    if (!ALL_LANG_CODES.has(code) || ENABLED.has(code)) continue
  }
}

// 🪦 ПРАВИЛО `lang-extra-dict` ОТМЕНЕНО 2026-09-21 ПО СЛОВУ ВЛАДЕЛЬЦА.
// Оно объявляло нарушением язык, лежащий в словаре и не включённый в сборке.
// Это несуществующая проблема: при правильной генерации страниц посетитель
// получает ровно один язык независимо от того, сколько их лежит в исходнике.
// Слова владельца: «это не проблема лишнего языка, это проблема неправильной
// архитектуры, и только это надо проверять».
// Правило ввёл я в шаге 255, ошибочно обобщив другую задачу: тогда в шести
// языках стоял английский текст — то есть переводов НЕ БЫЛО, и убрать надо было
// подделки, а не языки. Настоящую опасность проверяет scripts/check-lang-delivery.mjs.

/** Ключи объекта верхнего уровня; null, если это не объектный литерал. */
function objectKeys(src, i) {
  const keys = []
  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i])) i++
    if (src[i] === "}") return keys
    const km = /^(?:'([a-zA-Z-]+)'|"([a-zA-Z-]+)"|([a-zA-Z-]+))\s*:\s*/.exec(src.slice(i))
    if (!km) return null
    keys.push(km[1] ?? km[2] ?? km[3])
    let j = i + km[0].length
    const open = { "{": "}", "[": "]" }
    const stack = []
    while (j < src.length) {
      const c = src[j]
      if (c === '"' || c === "'" || c === "`") {
        const q = c
        j++
        while (j < src.length) { if (src[j] === "\\") { j += 2; continue } if (src[j] === q) { j++; break } j++ }
        continue
      }
      if (open[c]) { stack.push(open[c]); j++; continue }
      if (c === "}" || c === "]") {
        if (stack.length && stack[stack.length - 1] === c) { stack.pop(); j++; if (!stack.length) break; continue }
        break
      }
      if (c === "," && !stack.length) break
      j++
    }
    if (src[j] === ",") j++
    i = j
  }
  return keys
}

checkDataCells(APP)


for (const w of warnings) {
  console.log(`  предупреждение: ${w.rule} — ${w.file}\n    ${w.detail}`)
}

if (problems.length === 0) {
  console.log(`===CONTENT_OK=== проверено папок данных: ${dirs.length}, нарушений нет, предупреждений: ${warnings.length}`)
  process.exit(0)
}

console.error(`===CONTENT_FAILED=== нарушений: ${problems.length}\n`)
for (const p of problems) console.error(`  ${p.rule.padEnd(18)} ${p.file}\n${" ".repeat(21)}${p.detail}`)
console.error("\nПравила — навыки use-static-pages (ко-локация) и use-links (ссылки).")
process.exit(1)
