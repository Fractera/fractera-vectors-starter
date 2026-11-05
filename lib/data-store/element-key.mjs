// 654-1: THE ELEMENT'S OWN KEY — one file, word for word in every store of the node (data, storage, vectors; graph and memory keep the
// same function). The owner, 2026-11-05: «объектное хранилище должно быть обновлено не только для использования глубинной памятью но и
// для использования просто внутри элемента»; his choice in the window: «DATA_SECRET сейчас, другой — 655».
//
// 🔒 WHY A KEY AND NOT A NAME. A store gives an element only its own space, so the store must know WHO calls — and a name the caller
// writes itself (`x-agent-identity`, `from`) is a word, not a proof. The key is `<id>.<mac>`: the mac is an HMAC-SHA256 of the node's
// `DATA_SECRET` over the element id. Only a holder of `DATA_SECRET` — the core and the native elements — can make one; custom elements
// do not hold it (654-6). The store checks a key by itself, with no list to keep and no call to the core: an element and a store live
// without the core.
//
// 🔒 THE LABEL IS VERSIONED (`v1`). Changing the derivation means a new label, so an old key is never read under new rules.
import { createHmac, timingSafeEqual } from 'node:crypto'

const LABEL = 'fractera-element-key:v1:'
// The registry's element id (`lib/web4-items/paths.cjs` of the core, a DNS label): no dot, so `<id>.<mac>` splits at its first dot.
const ELEMENT_ID = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

/** True for a well-formed element id (also what keeps a file name made of it inside its folder). */
export function isElementId(id) {
  return typeof id === 'string' && ELEMENT_ID.test(id)
}

function macOf(secret, id) {
  return createHmac('sha256', secret).update(LABEL + id).digest('base64url')
}

/** The element's key, `<id>.<mac>` — made by the node's installer; a store never needs it except in a proof. */
export function elementKeyOf(id, secret) {
  if (!secret || !isElementId(id)) return null
  return `${id}.${macOf(secret, id)}`
}

/** The element a presented key belongs to, or null: a bad shape, an id that is not an element id, an empty secret, a wrong mac. */
export function elementOf(presented, secret) {
  if (!secret || typeof presented !== 'string') return null
  const dot = presented.indexOf('.')
  if (dot <= 0) return null
  const id = presented.slice(0, dot)
  if (!isElementId(id)) return null
  const given = Buffer.from(presented.slice(dot + 1))
  const expected = Buffer.from(macOf(secret, id))
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  return id
}
