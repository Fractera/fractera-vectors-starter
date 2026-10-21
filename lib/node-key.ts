// THE NODE KEY OF A DOOR (node step 548-16). One check for every door that the other elements of the node call: the header
// `X-Node-Key` against this element's `SETTINGS_SECRET`, compared in constant time. A door made by `npm run door:add` imports it;
// before 548-16 every door repeated these lines (app/api/a2a/route.ts and the doors agents wrote).
//
// 🔒 The gate of `proxy.ts` lets a call on the machine's loopback through (`lib/auth/owner-at-machine.ts`) — a neighbour calls
// http://127.0.0.1:<port>/api/<door>. From the internet the gate asks for a session first, so a node door stays inside the node.
import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

export const NO_STORE = { "Cache-Control": "no-store" }

export function nodeKeyOk(given: string | null): boolean {
  const expected = process.env.SETTINGS_SECRET ?? ""
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** The answer to a call without the node key: the reason and the header the caller needs. */
export function needNodeKey() {
  return NextResponse.json(
    { error: "bad_key", reason: "send the node key in the X-Node-Key header" },
    { status: 401, headers: { ...NO_STORE, "WWW-Authenticate": 'ApiKey header="X-Node-Key"' } },
  )
}
