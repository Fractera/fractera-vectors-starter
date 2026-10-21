// A2A OF THE ELEMENT — what is left of the hand-written JSON-RPC endpoint (step 418-1): the protocol moved to the official SDK
// (`lib/a2a/sdk-server.ts`, work in `lib/a2a/executor.ts`). Here: the list of code skills served over A2A (read by the card and the
// passport guard) and the JSON-RPC error the route answers with BEFORE the SDK (node boundary, node key, protocol version).

export const A2A_SKILLS = ["site-shell", "redraw-pages", "catalog-find", "catalog-get", "catalog-contribute"] as const

const DOMAIN = "a2a-protocol.org"
const errorInfo = (reason: string, domain = DOMAIN) => [{ "@type": "type.googleapis.com/google.rpc.ErrorInfo", reason, domain }]

/** JSON-RPC 2.0 error in the A2A §9.5 form. */
export function rpcError(id: unknown, code: number, message: string, reason: string, domain = DOMAIN) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, data: errorInfo(reason, domain) } }
}
