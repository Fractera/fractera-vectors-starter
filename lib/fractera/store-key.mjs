// THE KEY THIS NATIVE ELEMENT OPENS THE NODE'S STORES WITH (node steps 654-6, 857) — one place for the server code (`data-service.ts`)
// and for the scripts Next does not start (`scripts/seed-media*.mjs`).
//
// 🔒 NODE STEP 857 (Roma 2026-11-24, the fractera.ai server: «DATA_SECRET is empty … the data layer answers it 401, and lib/db silently
// falls back to a local data/app.db»). A native element PREINSTALLED with the node holds the node's data key (DATA_SECRET) and serves
// every element — it keeps it, first. A native element BORN on a node («Создать нативный элемент») is registry kind `user`: the node
// installer withholds DATA_SECRET from it (818-7c — with it an element could make any element's key) and writes its own ELEMENT_KEY
// (`<element id>.<mac>`), which opens only its own space in every store. Before 857 this template read only DATA_SECRET, so every native
// element born on a node had no key at all. The custom template reads ELEMENT_KEY first; a native one reads it where the node key is absent.
// 🔒 No `node:fs` here: the module stays importable by any server file; a script reads its own `.env.local` and passes the values in.

/**
 * The headers that open the stores: `{ 'X-Data-Secret' }`, `{ 'X-Element-Key' }` or none. `env` — the process environment by default.
 * @param {Record<string, string | undefined>} [env]
 * @returns {Record<string, string>}
 */
export function storeHeaders(env = process.env) {
  const node = String(env.DATA_API_KEY || env.DATA_SECRET || '').trim()
  if (node) return { 'X-Data-Secret': node }
  const own = String(env.ELEMENT_KEY ?? '').trim()
  return own ? { 'X-Element-Key': own } : {}
}

/**
 * Which key the headers carry — for words to a person: `element <id>`, `node` or `none`.
 * @param {Record<string, string>} headers
 * @returns {string}
 */
export function storeScope(headers) {
  if (headers['X-Element-Key']) return `element ${String(headers['X-Element-Key']).split('.')[0]}`
  return headers['X-Data-Secret'] ? 'node' : 'none'
}
