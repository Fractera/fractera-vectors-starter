// 550: векторное хранилище узла — векторы прежнего слоя данных: `/health` без ключа → только с этой машины → ключ или
// сессия → право по классу → `/vectors/*` → `/capabilities`. Замок тот же, что у базы данных (`auth.mjs` дословно общий):
// база пересылает сюда прежние адреса `/vectors/*` вместе с ключом и кукой, и ответ обязан быть тем же.
//
// 🔒 СВОЙ ФАЙЛ БАЗЫ (`data/vectors.db` в папке элемента). До 550 векторы жили в одном файле с таблицами — «одна копия,
// одна защита, одно стирание». Владелец разделил слой данных на элементы (2026-10-21), и у склада теперь своя папка; связь
// с таблицами по-прежнему записью (`refTable`, `refId`), а не внешним ключом. Индекс (vec0) — производные данные: при
// старте он пересобирается, если в нём меньше записей, чем в таблице.
//
// 🔒 ОДИН ЭКЗЕМПЛЯР НА ПРОЦЕСС (`globalThis`): сборщик кладёт этот модуль в каждый маршрут.
import Database from 'better-sqlite3'
import { existsSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import { createApp, dispatch, listRoutes } from './express-shim.mjs'
import { onlyFromThisMachine, requireAuth, requireCapability, elementMayUse, PRIVILEGED_ROLES } from './auth.mjs'
import { ELEMENT_DIR, embeddingsStatus } from './context.mjs'
import { registerVectors } from './vectors.mjs'

export const VECTORS_DB = process.env.VECTORS_DB_PATH ? resolve(ELEMENT_DIR, process.env.VECTORS_DB_PATH) : resolve(ELEMENT_DIR, 'data/vectors.db')

// 626-3: СКЛАД, ПОСЧИТАННЫЙ ДРУГОЙ МОДЕЛЬЮ, ОТКЛАДЫВАЕТСЯ ЦЕЛИКОМ (владелец 2026-11-02: «Нет, начать с чистого листа»): его файл
// переименовывается рядом в `vectors.<модель>-<дата>.db` — больше не читается, ничего не удаляется, — и для модели, которую называет
// `embeddings`, заводится новый. Модель записана в самом складе (`store_meta`); склад прежнего устройства (до 626, записи нет)
// считал OpenAI и откладывается как `vectors.openai-<дата>.db`. Файл без таблицы векторов просто используется.
function setAsideOtherModel(file, model) {
  if (!existsSync(file)) return null
  const db = new Database(file)
  let recorded = null
  let hasVectors = false
  try {
    const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name))
    hasVectors = tables.has('vectors')
    if (tables.has('store_meta')) recorded = db.prepare("SELECT value FROM store_meta WHERE key = 'model'").get()?.value ?? null
    // The journal goes into the file before the rename, so the set-aside file holds everything by itself.
    if (hasVectors && recorded !== model) db.pragma('wal_checkpoint(TRUNCATE)')
  } finally {
    db.close()
  }
  if (!hasVectors || recorded === model) return null
  const tag = recorded ? recorded.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'other' : 'openai'
  const base = file.endsWith('.db') ? file.slice(0, -3) : file
  const day = new Date().toISOString().slice(0, 10)
  let target = `${base}.${tag}-${day}.db`
  for (let i = 2; existsSync(target); i += 1) target = `${base}.${tag}-${day}-${i}.db`
  renameSync(file, target)
  for (const side of ['-wal', '-shm']) if (existsSync(file + side)) renameSync(file + side, target + side)
  console.log(`Vectors: the store counted by ${recorded ?? 'OpenAI (before 626)'} is set aside as ${target}; a new one for ${model}`)
  return target
}

async function build() {
  const app = createApp()

  // ── GET /health — no auth ──
  app.get('/health', (_req, res) => res.json({ ok: true }))

  app.use(onlyFromThisMachine)
  app.use(requireAuth)
  app.use(requireCapability)
  // 654-3: the element's own key opens the vector doors — on its own collections only (`vectors.mjs`, «WHOSE VECTORS»), and the
  // description of this element; nothing else here is the node's.
  app.use(elementMayUse((req) => /^\/vectors(\/|$)/i.test(req.path) || /^\/capabilities\/?$/i.test(req.path)))

  // 626-3: the model of the store is the one `embeddings` names — asked before the store opens; no answer → this build fails, and
  // the next request builds again (vectorsApp below).
  const live = await embeddingsStatus()
  if (!live?.model || !Number.isInteger(live.dims)) throw new Error('embeddings named no model')
  const store = { model: live.model, dims: live.dims, setAside: setAsideOtherModel(VECTORS_DB, live.model) }
  const appDb = new Database(VECTORS_DB)
  appDb.pragma('journal_mode = WAL')
  appDb.exec('CREATE TABLE IF NOT EXISTS store_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)')
  const record = appDb.prepare('INSERT INTO store_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
  record.run('model', store.model)
  record.run('dims', String(store.dims))
  await registerVectors(app, appDb, store)

  // ── GET /capabilities — элемент описывает СЕБЯ САМ: список порождается из зарегистрированных маршрутов, ключей нет.
  app.get('/capabilities', (req, res) => {
    res.json({
      service: 'fractera-vectors',
      generatedAt: new Date().toISOString(),
      auth: {
        machine: { header: 'x-data-secret', identity: 'x-agent-identity (optional)' },
        // 654-3: an element's own key — its own collections, kept as el/<id>/<name> and answered by its own names.
        element: { header: 'x-element-key', value: '<element id>.<mac>', opens: '/vectors/* on its own collections, by its own names' },
        human: { cookie: true, requiredRoles: [...PRIVILEGED_ROLES] },
      },
      vectors: { model: store.model, dims: store.dims },
      routes: listRoutes(app),
    })
  })

  return app
}

export function vectorsApp() {
  // 626-3: a build that failed (the node's `embeddings` not answering yet) is forgotten, so the next request builds again.
  globalThis.__fracteraVectorsApp ??= build().catch((err) => {
    globalThis.__fracteraVectorsApp = null
    throw err
  })
  return globalThis.__fracteraVectorsApp
}

/** Обработчик маршрута Next: весь запрос — в двери векторного хранилища. */
export async function handle(request) {
  let app
  try {
    app = await vectorsApp()
  } catch (err) {
    // Same as onlyFromThisMachine: a request through the tunnel learns nothing.
    if (request.headers.get('cf-ray')) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json({ error: 'embeddings_unavailable', reason: String(err?.message ?? err) }, { status: 503 })
  }
  return dispatch(app, request)
}
