// 550: замок слоя данных — дословно из прежнего `server.js` (`requireAuth`, `requireCapability`) и `auth-bypass.js`.
// Один файл на три элемента хранения (база данных, объектное и векторное хранилище): ключ у них общий — `DATA_SECRET`
// узла, — и правило «кто куда» обязано быть одним, иначе одна дверь пустит туда, куда другая не пускает.
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { AUTH_URL, ELEMENT_DIR } from './context.mjs'

// Режим «голый IP без авторизации» серверной линии (`FRACTERA_IP_NODOMAIN_MODE`). Файл окружения перечитывается не
// чаще раза в 5 с: флаг меняется без перезапуска службы, как и прежде.
const ENV_FILE = process.env.FRACTERA_ENV_FILE ?? join(ELEMENT_DIR, '.env.local')
const TTL_MS = 5_000
let cachedValue = null
let cachedMtime = -1
let cachedAt = 0

function flagFromFile() {
  const now = Date.now()
  if (now - cachedAt < TTL_MS) return cachedValue
  cachedAt = now
  try {
    const mtime = statSync(ENV_FILE).mtimeMs
    if (mtime === cachedMtime) return cachedValue
    cachedMtime = mtime
    const match = readFileSync(ENV_FILE, 'utf8').match(/^FRACTERA_IP_NODOMAIN_MODE=(.*)$/m)
    cachedValue = match ? match[1].trim().replace(/^["']|["']$/g, '') : null
  } catch {
    cachedMtime = -1
    cachedValue = null
  }
  return cachedValue
}

export function shouldBypassAuth() {
  if (process.env.NODE_ENV === 'development') return true
  const fromFile = flagFromFile()
  if (fromFile !== null) return fromFile === 'true'
  return process.env.FRACTERA_IP_NODOMAIN_MODE === 'true'
}

// 🔒 ИЗ ИНТЕРНЕТА — ТОЛЬКО СТРАНИЦА (узел, шаг 289-1). Запрос через туннель Cloudflare несёт `cf-ray`; двери к данным —
// для программ ЭТОЙ машины и никогда не открываются наружу, даже с ключом.
export function onlyFromThisMachine(req, res, next) {
  if (req.headers['cf-ray']) return res.status(404).json({ error: 'Not found' })
  next()
}

// 🔒 ЧЕМ ВОШЛИ — ФАКТ ЗАПРОСА (`req.authVia`): проверка ниже различает машину и человека.
export async function requireAuth(req, res, next) {
  if (shouldBypassAuth()) {
    req.session = { userId: 'demo@local', email: 'demo@local', roles: ['admin'] }
    req.authVia = 'bypass'
    return next()
  }
  const dataSecret = process.env.DATA_SECRET
  if (dataSecret && req.headers['x-data-secret'] === dataSecret) {
    const agentId = req.headers['x-agent-identity'] ?? 'agent'
    req.session = { userId: `${agentId}@agent`, email: `${agentId}@agent`, roles: ['agent'] }
    req.authVia = 'secret'
    return next()
  }
  const cookie = req.headers.cookie ?? ''
  try {
    const r = await fetch(`${AUTH_URL}/api/session`, { headers: { cookie } })
    if (!r.ok) return res.status(401).json({ error: 'Unauthorized' })
    req.session = await r.json()
    req.authVia = 'cookie'
    next()
  } catch {
    res.status(503).json({ error: 'Auth service unavailable' })
  }
}

// 🔒 ДВА КЛАССА ПРАВ (найдено 2026-08-22): СХЕМА (`/db/migrate`, удаление таблицы — произвольный SQL) — только машина с
// секретом, кука не пропуск никогда; ДАННЫЕ — секрет или привилегированная роль, покупателю здесь делать нечего.
export const PRIVILEGED_ROLES = new Set(['architect', 'admin', 'agent'])

/** Маршруты, выполняющие произвольный SQL или уничтожающие таблицу. */
function isSchemaRoute(req) {
  const p = req.path
  const clean = p.endsWith('/') && p.length > 1 ? p.slice(0, -1) : p
  if (req.method === 'POST' && clean === '/db/migrate') return true
  if (req.method === 'DELETE' && p.startsWith('/db/tables/') && p.split('/').filter(Boolean).length === 3) return true
  return false
}

export function requireCapability(req, res, next) {
  const via = req.authVia
  const roles = Array.isArray(req.session?.roles) ? req.session.roles : []

  if (isSchemaRoute(req)) {
    if (via === 'secret' || via === 'bypass') return next()
    return res.status(403).json({
      error: 'Schema routes require the data-service secret, not a session',
    })
  }

  if (via === 'secret' || via === 'bypass') return next()
  if (roles.some(r => PRIVILEGED_ROLES.has(r))) return next()
  return res.status(403).json({ error: 'Forbidden: the data layer is not a customer surface' })
}
