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
import { resolve } from 'node:path'
import { createApp, dispatch, listRoutes } from './express-shim.mjs'
import { onlyFromThisMachine, requireAuth, requireCapability, PRIVILEGED_ROLES } from './auth.mjs'
import { ELEMENT_DIR, EMBED_MODEL, EMBED_DIMS } from './context.mjs'
import { registerVectors } from './vectors.mjs'

export const VECTORS_DB = process.env.VECTORS_DB_PATH ? resolve(ELEMENT_DIR, process.env.VECTORS_DB_PATH) : resolve(ELEMENT_DIR, 'data/vectors.db')

async function build() {
  const app = createApp()

  // ── GET /health — no auth ──
  app.get('/health', (_req, res) => res.json({ ok: true }))

  app.use(onlyFromThisMachine)
  app.use(requireAuth)
  app.use(requireCapability)

  const appDb = new Database(VECTORS_DB)
  appDb.pragma('journal_mode = WAL')
  await registerVectors(app, appDb)

  // ── GET /capabilities — элемент описывает СЕБЯ САМ: список порождается из зарегистрированных маршрутов, ключей нет.
  app.get('/capabilities', (req, res) => {
    res.json({
      service: 'fractera-vectors',
      generatedAt: new Date().toISOString(),
      auth: {
        machine: { header: 'x-data-secret', identity: 'x-agent-identity (optional)' },
        human: { cookie: true, requiredRoles: [...PRIVILEGED_ROLES] },
      },
      vectors: { model: EMBED_MODEL, dims: EMBED_DIMS },
      routes: listRoutes(app),
    })
  })

  return app
}

export function vectorsApp() {
  globalThis.__fracteraVectorsApp ??= build()
  return globalThis.__fracteraVectorsApp
}

/** Обработчик маршрута Next: весь запрос — в двери векторного хранилища. */
export async function handle(request) {
  return dispatch(await vectorsApp(), request)
}
