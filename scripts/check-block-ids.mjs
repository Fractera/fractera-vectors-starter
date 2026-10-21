// СТОРОЖ АДРЕСОВ БЛОКОВ (node step 317-1). У каждого блока страницы — постоянный адрес `bid` (block id): по нему подсветка в Preview
// называет блок («страница · файл · блок k3f9a»), и агент открывает ровно этот блок. Порядковый номер для этого не годится:
// вставили блок сверху — все адреса сдвинулись, и скопированный адрес указывает на чужой абзац.
//
// 🔒 ПОЛЕ `bid`, А НЕ `id`: у `section-head` поле `id` уже занято якорем заголовка (`privacy-h1`).
// Правила: `bid` — буква + 4 знака base36; внутри одного файла не повторяется; у одного блока на разных языках один `bid`
// (адрес — блоку, а не языку). `npm run blocks:ids` (`--fix`) дописывает недостающие: блок `<язык>.json` на той же позиции
// и того же вида, что в `en.json`, получает его `bid`; остальные — новый.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const FIX = process.argv.includes('--fix')
const ID = /^[a-z][a-z0-9]{4}$/
const LANG = /^([a-z]{2})\.json$/

function newId(taken) {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (;;) {
    const b = randomBytes(5)
    let id = a[b[0] % 26]
    for (let i = 1; i < 5; i++) id += a[b[i] % 36]
    if (!taken.has(id)) { taken.add(id); return id }
  }
}

// Папки страниц: `_data` (корень ветки) и `_pages/<slug>` (дети).
function pageDirs(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (!statSync(p).isDirectory()) continue
    if (existsSync(join(p, 'en.json')) && (name === '_data' || dir.endsWith('_pages'))) out.push(p)
    pageDirs(p, out)
  }
  return out
}

const rel = (p) => relative(ROOT, p).split(sep).join('/')
const errors = []
let fixed = 0

for (const dir of pageDirs(join(ROOT, 'app'))) {
  const files = readdirSync(dir).filter((f) => LANG.test(f)).sort((a, b) => (a === 'en.json' ? -1 : b === 'en.json' ? 1 : a.localeCompare(b)))
  const read = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'))
  const en = read('en.json')
  const enBlocks = Array.isArray(en.blocks) ? en.blocks : []
  const taken = new Set(enBlocks.map((b) => b.bid).filter(Boolean))
  for (const f of files) {
    const data = f === 'en.json' ? en : read(f)
    if (!Array.isArray(data.blocks)) continue
    const seen = new Set()
    let changed = false
    data.blocks.forEach((b, i) => {
      if (!b.bid && FIX) {
        const twin = enBlocks[i]
        b.bid = f !== 'en.json' && twin?.bid && twin.kind === b.kind ? twin.bid : newId(taken)
        changed = true
        fixed++
      }
      if (!b.bid) errors.push(`${rel(join(dir, f))}: блок ${i} (${b.kind}) без bid`)
      else if (!ID.test(b.bid)) errors.push(`${rel(join(dir, f))}: bid «${b.bid}» — нужна буква и 4 знака base36`)
      else if (seen.has(b.bid)) errors.push(`${rel(join(dir, f))}: bid «${b.bid}» повторяется`)
      seen.add(b.bid)
    })
    if (changed) writeFileSync(join(dir, f), JSON.stringify(data, null, 2) + '\n')
  }
}

if (errors.length) {
  for (const e of errors) console.error(`  ${e}`)
  console.error(`===BLOCK_IDS_FAILED=== ошибок: ${errors.length}. Дописать недостающие: npm run blocks:ids`)
  process.exit(1)
}
console.log(`===BLOCK_IDS_OK===${fixed ? ` дописано bid: ${fixed}` : ''} у всех блоков есть постоянный адрес`)
