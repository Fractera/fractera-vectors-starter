// @api the element's own agent puts its answer into an A2A task
import { timingSafeEqual } from "node:crypto"
import { newA2aId } from "@/lib/a2a/ids"
import { NextRequest, NextResponse } from "next/server"
import { hiddenFrom } from "@/lib/a2a/boundary"
import { getTask, saveTask, type Part } from "@/lib/a2a/tasks"
import { logCall } from "@/lib/a2a/log"
import { blockedReason, checkOutbound, checkOutboundData, loadPolicy, logGuard } from "@/lib/a2a/guard.mjs"
import { elementRoot } from "@/lib/page-tree"

// ОТВЕТ АГЕНТА В ЗАДАЧУ A2A (шаг узла 409-2). Агент этого элемента, разбуженный задачей «только текст», кладёт сюда ответ:
// POST `{ text, data?, failed? }` с ключом узла → задача `TASK_STATE_COMPLETED` (или `FAILED`), вызывающий забирает её
// `GetTask`. Ответ уходит в журнал узла записью `TaskResult` — лента и Telegram показывают его ответом в той же беседе.
// Только с этой машины: граница узла и ключ — как у конечной точки A2A.
export const dynamic = "force-dynamic"

const HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" }

function keyOk(given: string | null): boolean {
  const expected = process.env.SETTINGS_SECRET ?? ""
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (hiddenFrom(req.headers)) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404, headers: HEADERS })
  if (!keyOk(req.headers.get("x-node-key"))) return NextResponse.json({ ok: false, error: "node key required (X-Node-Key)" }, { status: 401, headers: HEADERS })
  const { id } = await params
  const task = getTask(id)
  if (!task) return NextResponse.json({ ok: false, error: "task not found" }, { status: 404, headers: HEADERS })
  if (task.status.state === "TASK_STATE_COMPLETED" || task.status.state === "TASK_STATE_CANCELED") {
    return NextResponse.json({ ok: false, error: `task is already ${task.status.state}` }, { status: 409, headers: HEADERS })
  }
  let body: { text?: unknown; data?: unknown; failed?: unknown; state?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400, headers: HEADERS }) }
  // 418-4: the node core watches the agent's terminal — a permission question on screen → INPUT_REQUIRED (the agent waits for its
  // person, not working), the question gone → WORKING. Only for a task still in progress; the answer below stays the only way to end it.
  if (body.state === "input-required" || body.state === "working") {
    if (task.status.state === "TASK_STATE_FAILED") return NextResponse.json({ ok: false, error: "task is already TASK_STATE_FAILED" }, { status: 409, headers: HEADERS })
    const waiting = body.state === "input-required"
    task.status = {
      state: waiting ? "TASK_STATE_INPUT_REQUIRED" : "TASK_STATE_WORKING",
      timestamp: new Date().toISOString(),
      message: {
        messageId: newA2aId(), role: "ROLE_AGENT",
        parts: waiting
          ? [{ text: "The agent is waiting for its person to allow an action in its terminal.", mediaType: "text/plain", metadata: { lang: "en" } }, { text: "Агент ждёт, пока человек разрешит действие в его терминале.", mediaType: "text/plain", metadata: { lang: "ru" } }]
          : [{ text: "The agent is working on the task.", mediaType: "text/plain", metadata: { lang: "en" } }, { text: "Агент работает над задачей.", mediaType: "text/plain", metadata: { lang: "ru" } }],
      },
    }
    saveTask(task)
    return NextResponse.json({ ok: true, state: task.status.state }, { headers: HEADERS })
  }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 6000) : ""
  if (!text) return NextResponse.json({ ok: false, error: "text (the answer for the human) is required" }, { status: 400, headers: HEADERS })
  // Outbound guard (step 419-2): the answer goes to another agent — a denied answer changes nothing in the task and the agent
  // gets the rules by name to answer otherwise; masked parts go out as [hidden]. The log line carries no text.
  const policy = loadPolicy(elementRoot())
  const checkedText = checkOutbound(text, policy)
  const checkedData = body.data !== undefined ? checkOutboundData(body.data, policy) : null
  const rules = [...new Set([...checkedText.rules, ...(checkedData?.rules ?? [])])]
  const denied = checkedText.verdict === "deny" || checkedData?.verdict === "deny"
  if (rules.length) logGuard(process.env.SERVICE_DATA_DIR, { channel: "reply", verdict: denied ? "deny" : "mask", rules, taskId: task.id })
  if (denied) return NextResponse.json({ ok: false, error: "blocked", rules, reason: blockedReason(rules) }, { status: 422, headers: HEADERS })
  const parts: Part[] = [{ text: checkedText.text, mediaType: "text/plain" }]
  if (checkedData) parts.push({ data: checkedData.data, mediaType: "application/json" })
  const state = body.failed === true ? "TASK_STATE_FAILED" : "TASK_STATE_COMPLETED"
  const startedAt = Date.parse(String(task.metadata?.createdAt ?? ""))
  task.status = { state, timestamp: new Date().toISOString() }
  task.artifacts = [{ artifactId: newA2aId(), name: "agent-answer", parts }]
  saveTask(task)
  const from = typeof task.metadata?.from === "string" ? task.metadata.from : "unknown"
  logCall({
    from, method: "TaskResult", taskId: task.id, contextId: task.contextId, state, httpStatus: 200,
    durationMs: Number.isFinite(startedAt) ? Date.now() - startedAt : 0,
    request: { params: { message: task.history?.[0] ?? null } }, response: { result: { task } },
  })
  return NextResponse.json({ ok: true, state, ...(rules.length ? { masked: rules } : {}) }, { headers: HEADERS })
}
