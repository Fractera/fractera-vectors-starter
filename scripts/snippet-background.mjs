// ФОН СНИППЕТОВ ПРОЕКТА (шаг узла 458-3, навык `.claude/skills/build-skills/skills/page-snippet`). Один файл на проект:
// `public/images/snippet/background.webp` (1200×630). Его берёт функция `lib/snippet/render.mjs` для каждой страницы.
//
// Слово владельца 2026-10-12: «сделай навык который в случае отсутствия этого изображения создаст background по требованию
// заказчика для СНИПа сохранит его файлы».
//
// Два способа, оба — только по слову заказчика (агент сначала спрашивает, какой фон он хочет):
//   node scripts/snippet-background.mjs --prompt "<описание заказчика>" [--quality low|medium|high] [--model <имя>]
//       картинка OpenAI Images API (`POST /v1/images/generations`), ключ — OPENAI_API_KEY элемента (окружение или .env.local).
//       💰 Стоит денег: агент называет цену ДО запуска (навык, раздел «Price»).
//   node scripts/snippet-background.mjs --pattern [--seed "<текст>"]
//       без ключа и без денег: узор в цветах DESIGN-CONFIG, тот же, что рисует функция, когда фона нет.
// Существующий фон не перезаписывается без --force: прежний файл — решение заказчика.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { designColors, patternSvg, SNIPPET_WIDTH, SNIPPET_HEIGHT } from '../lib/snippet/render.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'public', 'images', 'snippet', 'background.webp')
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : undefined
}
const has = (name) => process.argv.includes(`--${name}`)
const fail = (why) => {
  console.error(`===SNIPPET_BACKGROUND_FAILED=== ${why}`)
  process.exit(1)
}

if (fs.existsSync(OUT) && !has('force')) fail(`${path.relative(ROOT, OUT)} already exists — pass --force to replace it`)
fs.mkdirSync(path.dirname(OUT), { recursive: true })

const save = async (input) => {
  await sharp(input).resize(SNIPPET_WIDTH, SNIPPET_HEIGHT, { fit: 'cover' }).webp({ quality: 82 }).toFile(OUT)
  console.log(`===SNIPPET_BACKGROUND_OK=== ${path.relative(ROOT, OUT)} ${fs.statSync(OUT).size} bytes`)
}

if (has('pattern')) {
  await save(patternSvg(arg('seed') ?? 'background', designColors(ROOT)))
  process.exit(0)
}

const prompt = arg('prompt')
if (!prompt) fail('pass --prompt "<what the customer wants>" or --pattern')

const key = process.env.OPENAI_API_KEY || (() => {
  try {
    return fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').match(/^OPENAI_API_KEY=(.+)$/m)?.[1]?.trim()
  } catch {
    return undefined
  }
})()
if (!key) fail('no OPENAI_API_KEY in the environment or .env.local — use --pattern or ask the owner for a key')

// Фон под текст: слова заказчика как есть, плюс цвета темы из DESIGN-CONFIG («в цветах темы» модель сама не знает) и просьба
// оставить левую часть тихой под заголовок. 1536×864 — 16:9, кратно 16.
// ✗ 458-3: здесь стояло «no letters» — и спорило с заказчиком, попросившим букву на экранах; запрещены только слова и подписи.
const theme = designColors(ROOT)
const full = `${prompt}. Wide background image for a social preview card. Theme colours: background ${theme.background}, main colour ${theme.primary}, text colour ${theme.foreground}. No words, captions, logos or watermarks. Keep the left half calm and darker so a large white headline stays readable.`
const res = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
  body: JSON.stringify({ model: arg('model') ?? 'gpt-image-2.5-flare', prompt: full, size: '1536x864', quality: arg('quality') ?? 'medium', output_format: 'png', n: 1 }),
  signal: AbortSignal.timeout(180_000),
}).catch((e) => fail(`no answer from OpenAI: ${e.message}`))
const body = await res.json().catch(() => ({}))
if (!res.ok) fail(`OpenAI ${res.status}: ${body?.error?.message ?? 'unknown error'}`)
const b64 = body?.data?.[0]?.b64_json
if (!b64) fail('OpenAI answered without data[0].b64_json')
await save(Buffer.from(b64, 'base64'))
