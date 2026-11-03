// 550: постоянные прежнего `server.js` слоя данных — пути, адреса; 626-3: дверь к модели векторов узла.
//
// 🔒 КОРЕНЬ — ПАПКА ЭЛЕМЕНТА (`ELEMENT_DIR`), А НЕ `process.cwd()`: собранный сервер Next делает chdir в свою сборку, и
// относительный путь увёл бы базы внутрь `.next-*` — следующая сборка стёрла бы данные (тот же класс, что 260-1 и 549-1).
// Прежний сервер считал пути от своего файла; в папке элемента это тот же адрес.
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

export const ELEMENT_DIR = process.env.ELEMENT_DIR || process.cwd()

export const PORT = process.env.PORT ?? 3300
export const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001'
export const STORAGE_DIR = resolve(ELEMENT_DIR, 'storage')
export const ICONS_DIR = resolve(ELEMENT_DIR, 'icons')
export const MEDIA_DB = resolve(ELEMENT_DIR, 'data/media.db')
export const APP_DB = process.env.APP_DB_PATH ? resolve(ELEMENT_DIR, process.env.APP_DB_PATH) : resolve(ELEMENT_DIR, '../../app/data/products.db')

mkdirSync(resolve(ELEMENT_DIR, 'data'), { recursive: true })

// 626-3: ВЕКТОРЫ СЧИТАЕТ СВОЙ ЭЛЕМЕНТ УЗЛА `embeddings` (paraphrase-multilingual-MiniLM-L12-v2, 384 числа, на этом компьютере,
// без ключа) — OpenAI не считает ни одного, ключ OpenAI здесь не читается. Адрес — ответ установщика (`EMBEDDINGS_URL`, правило
// соседей), ключ его дверей — общий ключ узла (`SETTINGS_SECRET` в заголовке X-Node-Key). Модель и размер склад узнаёт у него же.
export const EMBEDDINGS_URL = (process.env.EMBEDDINGS_URL ?? '').trim().replace(/\/+$/, '')

async function askEmbeddings(path, body) {
  if (!EMBEDDINGS_URL) throw new Error('EMBEDDINGS_URL is empty — the node has no embeddings element (npm run services:install)')
  const r = await fetch(`${EMBEDDINGS_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Node-Key': process.env.SETTINGS_SECRET ?? '' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120_000),
  })
  const answer = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`embeddings ${path} answered ${r.status}${answer.reason ? `: ${answer.reason}` : ''}`)
  return answer
}

/** The model and its size as `embeddings` names them: { model, dims, ready, … } — it answers while the model still loads. */
export const embeddingsStatus = () => askEmbeddings('/api/embed-status')

/** One text → its vector, counted by `embeddings`. */
export async function embed(text) {
  const { vectors } = await askEmbeddings('/api/embed', { texts: [text] })
  return vectors[0]
}
