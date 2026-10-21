// @api answer agent-to-agent JSON-RPC calls from neighbours holding the node key
import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { rpcError } from "@/lib/a2a/endpoint"
import { handleA2A } from "@/lib/a2a/sdk-server"
import { hiddenFrom } from "@/lib/a2a/boundary"
import { describeCall, logCall } from "@/lib/a2a/log"

// КОНЕЧНАЯ ТОЧКА A2A (привязка JSON-RPC, A2A v1.0) — объявлена в визитке `supportedInterfaces` (`/.well-known/agent-card.json`).
// Логика — официальный SDK A2A (`lib/a2a/sdk-server.ts`, исполнитель `lib/a2a/executor.ts`). Здесь: версия протокола (`A2A-Version`, §3.2.6 — без заголовка клиент считается 0.3, её здесь
// нет), ключ узла (`X-Node-Key`; без него — HTTP 401 и ошибка JSON-RPC, §3.3.2 «Authentication Errors»), разбор JSON.
export const dynamic = "force-dynamic"

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" }

function keyOk(given: string | null): boolean {
  const expected = process.env.SETTINGS_SECRET ?? ""
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  // Каждый исход — и отказ — уходит в журнал узла (шаг узла 408): «до элемента не дозвались» лента обязана показать.
  const t0 = performance.now()
  let body: unknown
  const reply = (answer: unknown, init: { status?: number; headers: Record<string, string> }) => {
    // 409-2: чтения состояния задачи (GetTask, ListTasks) в журнал не идут — вызывающий опрашивает их, и лента с Telegram
    // заполнились бы повторами; ответ агента пишет дверь задач записью TaskResult.
    const method = (body as { method?: unknown } | undefined)?.method
    if (method !== "GetTask" && method !== "ListTasks") logCall({ ...describeCall(body, answer), httpStatus: init.status ?? 200, durationMs: performance.now() - t0, request: body, response: answer })
    return NextResponse.json(answer, init)
  }
  const raw = await req.text()
  try { body = JSON.parse(raw) } catch {
    body = raw.slice(0, 2000)
    return reply(rpcError(null, -32700, "Invalid JSON payload", "JSON_PARSE"), { headers: JSON_HEADERS })
  }
  const id = (body as { id?: unknown })?.id ?? null
  // Граница узла: внутренний элемент (видимость `node`) извне не вызывается — HTTP 403 (A2A §3.3.2 «Authorization Errors»).
  if (hiddenFrom(req.headers)) {
    return reply(rpcError(id, -32000, "Forbidden: this element serves only its own node", "NOT_VISIBLE_OUTSIDE_NODE", "fractera.ai"), { status: 403, headers: JSON_HEADERS })
  }
  if (!keyOk(req.headers.get("x-node-key"))) {
    return reply(rpcError(id, -32000, "Unauthenticated: send the node key in the X-Node-Key header", "UNAUTHENTICATED", "fractera.ai"), {
      status: 401, headers: { ...JSON_HEADERS, "WWW-Authenticate": 'ApiKey header="X-Node-Key"' },
    })
  }
  const version = req.headers.get("a2a-version")?.trim() ?? ""
  if (!/^1\.\d+$/.test(version)) {
    return reply(rpcError(id, -32009, `A2A version «${version || "0.3 (no header)"}» is not supported; use A2A-Version: 1.0`, "VERSION_NOT_SUPPORTED"), { headers: JSON_HEADERS })
  }
  // 418-1: протокол — официальный SDK A2A (lib/a2a/sdk-server.ts); ворота узла выше остаются нашими.
  return reply(await handleA2A(body, version), { headers: JSON_HEADERS })
}
