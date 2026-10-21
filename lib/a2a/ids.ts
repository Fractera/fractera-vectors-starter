import { randomBytes } from "node:crypto"
import { ownId } from "@/lib/own-id"

// A2A NUMBERS OF THIS ELEMENT (node step 412-3). The person, 2026-10-06: «идентификаторы сообщений разработать таким образом
// чтобы они включали в себя префикс агента» — message ids carry the agent's prefix, so an order summary can point at a
// conversation and anyone can tell who started it.
// 🔒 Prefix = the element's permanent id from the passport (`mzjce`), never its address: the address changes on rename.
// 🔒 The rest is a UUIDv7 (RFC 9562): the first 48 bits are milliseconds, so numbers sort in time order.
// A number the client sent (contextId, messageId) is never rewritten — the A2A spec lets the client choose it.
// Format `<id>-<uuidv7>`: letters, digits and dashes only, ≤ 64 characters (the task store accepts exactly that).

function uuidv7(): string {
  const b = randomBytes(16)
  // 48-bit milliseconds, big-endian; arithmetic stays below 2^53, so plain numbers are exact.
  let ms = Date.now()
  for (let i = 5; i >= 0; i--) {
    b[i] = ms % 256
    ms = Math.floor(ms / 256)
  }
  b[6] = (b[6] & 0x0f) | 0x70 // version 7
  b[8] = (b[8] & 0x3f) | 0x80 // RFC 9562 variant
  const h = b.toString("hex")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** A new A2A number of this element: `<element id>-<uuidv7>`. */
export function newA2aId(): string {
  const prefix = (ownId() ?? "element").replace(/[^A-Za-z0-9]/g, "").slice(0, 20) || "element"
  return `${prefix}-${uuidv7()}`
}
