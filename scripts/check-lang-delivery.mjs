// СТОРОЖ ДОСТАВКИ ЯЗЫКОВ: что уезжает в браузер (заведён 2026-09-21).
// Запуск: npm run check:lang-delivery
//
// 🔒 ЧТО ПРОВЕРЯЕТСЯ И ЧТО НЕ ПРОВЕРЯЕТСЯ — РАЗНИЦА КУПЛЕНА ЦЕЛЫМ ДНЁМ РАБОТЫ.
// Количество языков в исходнике НЕ проверяется и проблемой не является. Слова
// владельца 2026-09-21: «представь, что у нас три языка, а в переменных окружения
// разрешён только английский. Что произойдёт? Да ничего не произойдёт: в браузер
// при любом раскладе уедет только один язык. Это не проблема лишнего языка, это
// проблема неправильной архитектуры, и только это надо проверять».
//
// 🪦 ЗАМЕНЯЕТ ОТМЕНЁННОЕ ПРАВИЛО `lang-extra-dict` (`check-content.mjs`, шаг 255).
// Оно объявляло нарушением язык, лежащий в словаре и не включённый в сборке, —
// то есть требовало УДАЛЯТЬ готовые переводы. Причина ошибки названа честно: я
// обобщил другую задачу. Владелец просил убрать шесть языков, в которых стоял
// английский текст, — убрать надо было ПОДДЕЛКИ переводов, а не языки.
//
// 🛑 ПОЧЕМУ ТО ПРАВИЛО БЫЛО ОПАСНЕЕ, ЧЕМ ПРОСТО БЕСПОЛЕЗНЫМ. Оно зеленело ровно в
// том случае, который надо ловить: два включённых языка, затянутые в клиентский
// компонент, уезжают в браузер оба — набор совпадает с включённым, и правило
// молчит. И краснело в безопасном: 82 языка в серверном словаре, в браузер не
// уходит ничего. В день, когда узел включит все языки, оно позеленело бы совсем —
// то есть замолчало бы именно тогда, когда цена ошибки стала максимальной.
//
// 🔒 ЧТО ЛОВИТ ЭТОТ СТОРОЖ. Единственную настоящую беду: словарь, попавший в
// браузерный пакет целиком. Путь туда один — файл с "use client" импортирует
// словарь сам, вместо того чтобы получить строки пропсами от серверного родителя.
// Образец правильной сборки лежит рядом: `app/[lang]/layout.tsx` зовёт
// `bannerUi(lang)` на сервере и передаёт баннеру готовые строки (измерено
// 2026-09-21: ноль браузерных файлов содержат его строки).
//
// 🔒 ТРИ ВЕРДИКТА, А НЕ ДВА. Сторож приходит в дом, который строили до него,
// поэтому у него есть список ДОЛГА: места, нарушающие правило сегодня. Они
// печатаются при каждом прогоне с датой и не валят сборку. Новое нарушение вне
// списка — ошибка. Долг закрывается кодом, и строка из списка удаляется ТОЙ ЖЕ
// правкой, что и причина: удалить её отдельно значит купить зелёный цвет.

import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { isForeign } from './microservices-boundary.mjs'

const ROOT = process.cwd()
const out = []
let errors = 0
const fail = (m) => { errors += 1; out.push('  ОШИБКА: ' + m) }

// ── Список долга: известные нарушения, оставленные до отдельной работы ────────
const DEBT_FILE = 'scripts/lang-delivery-debt.json'
const debt = existsSync(join(ROOT, DEBT_FILE))
  ? JSON.parse(readFileSync(join(ROOT, DEBT_FILE), 'utf8'))
  : { since: '', items: [] }
const debtSet = new Set(debt.items.map((d) => d.file))

// ── Что считается словарём: имя файла говорит об этом прямо ──────────────────
const DICT = /(^|\/)(i18n|locales?)\//i
const DICT_NAME = /(\.i18n\.(ts|tsx|json)|-i18n\.(ts|tsx)|-strings\.(ts|tsx)|-translations\.(ts|tsx|json))$/i
const isDict = (spec) => DICT.test(spec) || DICT_NAME.test(spec)

let tracked
try {
  tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64e6 })
    .split('\n').map((x) => x.trim()).filter(Boolean)
} catch (e) {
  // Отсутствие источника — это отказ, а не пустой список.
  console.log('  ОШИБКА: git не дал список файлов: ' + e.message)
  console.log('\n===LANG_DELIVERY_FAILED=== ошибок: 1')
  process.exit(1)
}

const SRC = tracked.filter((f) => /\.(ts|tsx)$/.test(f)
  && !f.startsWith('.claude/')
  && !f.split('/').some(isForeign))

let clientFiles = 0
for (const rel of SRC) {
  let text
  try { text = readFileSync(join(ROOT, rel), 'utf8') } catch { continue }
  if (!/^\s*["']use client["']/m.test(text.slice(0, 400))) continue
  clientFiles += 1

  for (const m of text.matchAll(/from\s*["']([^"']+)["']/g)) {
    const spec = m[1]
    if (!isDict(spec)) continue
    // `import type { … }` стирается компилятором и в браузер не уезжает (узел, шаг 422: tool-translations-dialog берёт только тип).
    const stmt = text.slice(text.lastIndexOf('\n', m.index) + 1, m.index)
    if (/^\s*import\s+type\b/.test(stmt) || /^\s*import\s+type\b/.test(text.slice(text.lastIndexOf('import', m.index), m.index))) continue
    const line = text.slice(0, m.index).split('\n').length
    const msg = `${rel}:${line}: клиентский файл импортирует словарь «${spec}». ` +
      'Словарь уезжает в браузер ЦЕЛИКОМ, со всеми языками. Строки обязан выбрать ' +
      'сервер и передать пропсами — образец: app/[lang]/layout.tsx и bannerUi(lang).'
    if (debtSet.has(rel)) out.push(`  ДОЛГ (с ${debt.since}): ${msg}`)
    else fail(msg)
  }
}

console.log(`клиентских файлов проверено: ${clientFiles} из ${SRC.length}`)
console.log(`в списке долга: ${debtSet.size}`)
for (const line of out) console.log(line)

if (errors > 0) {
  console.log(`\n===LANG_DELIVERY_FAILED=== ошибок: ${errors}`)
  process.exit(1)
}
console.log('\n===LANG_DELIVERY_OK=== новых нарушений нет')
