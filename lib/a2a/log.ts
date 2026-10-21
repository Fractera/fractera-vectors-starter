import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { ownId } from "@/lib/own-id"

// ЗАПИСЬ ВЫЗОВОВ A2A В ЖУРНАЛ УЗЛА (шаг узла 408). Каждый вызов, дошедший до `/api/a2a`, — и отказ тоже — уходит ядру
// (`POST /api/node/a2a-log`, ключ узла); ядро пишет в слой данных и показывает лентой «Общение агентов».
// 🔒 Запись не ждётся и не влияет на ответ: журнал, упавший вместе с вызовом, хуже журнала без строки.
// 🔒 Ядро зовётся по петле, порт спрашивается у узла (`NODE_DOMAIN_FILE` → `logs/runtime.json`), а не помнится.

export type CallRecord = {
  from: string; method?: string; skill?: string; taskId?: string; contextId?: string; state?: string
  httpStatus: number; reason?: string; durationMs: number; request?: unknown; response?: unknown
}

export function coreUrl(): string | null {
  const file = process.env.NODE_DOMAIN_FILE?.trim()
  if (!file) return null
  try {
    // Хост — тот, что слушает ядро: у ядра `localhost` бывает IPv6, и 127.0.0.1 не отвечает.
    const rt = JSON.parse(readFileSync(join(dirname(dirname(file)), "logs", "runtime.json"), "utf8")) as { port?: unknown; hostname?: unknown }
    return Number.isInteger(rt.port) ? `http://${typeof rt.hostname === "string" && rt.hostname ? rt.hostname : "localhost"}:${rt.port}` : null
  } catch {
    return null
  }
}

export function logCall(rec: CallRecord): void {
  const core = coreUrl()
  const key = process.env.SETTINGS_SECRET ?? ""
  if (!core || !key) return
  fetch(`${core}/api/node/a2a-log`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Node-Key": key },
    body: JSON.stringify({ ...rec, to: ownId() ?? "unknown" }),
    signal: AbortSignal.timeout(5000),
  }).catch((e) => console.warn("[a2a-log] the core did not take the record:", String((e as Error).message ?? e)))
}

type Json = Record<string, unknown>

/** Что вызвано: метод, навык, задача — из тела запроса и ответа JSON-RPC. */
export function describeCall(body: unknown, answer: unknown): Pick<CallRecord, "from" | "method" | "skill" | "taskId" | "contextId" | "state" | "reason"> {
  const req = (body ?? {}) as Json
  const params = (req.params ?? {}) as Json
  const message = (params.message ?? {}) as Json
  const meta = (message.metadata ?? {}) as Json
  const parts = Array.isArray(message.parts) ? (message.parts as Json[]) : []
  const call = parts.map((p) => p.data as Json | undefined).find((d) => d && typeof d.skill === "string")
  const ans = (answer ?? {}) as Json
  const result = (ans.result ?? {}) as Json
  const task = ((result.task ?? result) ?? {}) as Json
  const status = (task.status ?? {}) as Json
  const err = (ans.error ?? null) as Json | null
  const info = err && Array.isArray(err.data) ? (err.data[0] as Json | undefined) : undefined
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined)
  return {
    from: str(meta.from)?.slice(0, 64) ?? "unknown",
    method: str(req.method),
    skill: call ? String(call.skill) : undefined,
    taskId: str(task.id) ?? str(params.id),
    contextId: str(task.contextId) ?? str(message.contextId),
    state: err ? "ERROR" : str(status.state),
    reason: str(info?.reason),
  }
}
