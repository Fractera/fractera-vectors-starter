import { Message as SdkMessage, Task as SdkTask } from "@a2a-js/sdk"
import { AgentEvent, type AgentExecutor, type ExecutionEventBus, type RequestContext } from "@a2a-js/sdk/server"
import { revalidatePath } from "next/cache"
import { newA2aId } from "@/lib/a2a/ids"
import { siteShellData } from "@/lib/shell/site-shell-data"
import { resolveTopGroups, resolveFooterGroups } from "@/lib/menu/site-menu"
import { SUPPORTED_LANGUAGES } from "@/config/translations/translations.config"
import { catalogContribute, catalogFind, catalogGet } from "@/lib/a2a/catalog"
import { humanParts } from "@/lib/a2a/human"
import { getTask, saveTask, type Json, type Message, type Task } from "@/lib/a2a/tasks"
import { coreUrl } from "@/lib/a2a/log"
import { ownId } from "@/lib/own-id"
import { checkOutboundData, loadPolicy, logGuard } from "@/lib/a2a/guard.mjs"
import { elementRoot } from "@/lib/page-tree"

// THE ELEMENT'S A2A WORK BEHIND THE OFFICIAL SDK (step 418-1). The SDK (`@a2a-js/sdk`, A2A v1.0.0) owns the protocol: JSON-RPC,
// methods, task ids (UUID — owner 2026-10-06: «Сервер на SDK, номера UUID»), states, errors. This executor owns only the work:
//   - a data part `{ skill, input }` — a code skill answers at once → COMPLETED with an artifact;
//   - text only — a task for this element's own agent: SUBMITTED, the core wakes the agent, the agent answers later through
//     `/api/a2a/tasks/<id>` and the caller reads it with GetTask (the store is the element's own task files).
// The executor publishes the task and finishes at once, so the caller is answered right away; later results land in the store.

const now = () => new Date().toISOString()
const say = (en: string, ru: string): Message => ({
  messageId: newA2aId(), role: "ROLE_AGENT",
  parts: [{ text: en, mediaType: "text/plain", metadata: { lang: "en" } }, { text: ru, mediaType: "text/plain", metadata: { lang: "ru" } }],
})

/** Wake this element's agent and hand it the task (409-2). Waits only for the start, not for the agent's answer. */
async function wakeAgent(task: Task, from: string, text: string) {
  const core = coreUrl()
  const key = process.env.SETTINGS_SECRET ?? ""
  const port = process.env.PORT ?? ""
  const set = (state: string, msg: Message) => { const t = getTask(task.id) ?? task; t.status = { state, timestamp: now(), message: msg }; saveTask(t) }
  if (!core || !key) return set("TASK_STATE_SUBMITTED", say("Waiting: the node core is not reachable to wake the agent.", "Ожидание: ядро узла недоступно, агента разбудить нечем."))
  // Владелец 2026-10-06: в живом прогоне 418-5 агент пропустил правило пробуждения из CLAUDE.md и сразу взялся за задачу —
  // поручение в руках сильнее правила в инструкции, поэтому «сначала узнай себя» стоит первой строкой поручения.
  const prompt = [
    `Сначала узнай себя: npm run passport -- me (навык own-service-props-detection; вывод читай целиком, не режь head; блок node — где ты живёшь). Соседа ищи только по нужде: npm run a2a -- find <английские слова>.`,
    `Задача A2A ${task.id} от ${from} (беседа ${task.contextId}).`,
    `Текст задачи: ${text}`,
    `Выполни по навыку a2a-conversation и ответь командой: npm run a2a -- reply ${task.id} "<ответ человеческим языком>"`,
    `(данные — --data '<json>'; не получилось — --failed и почему). Не curl: команда сама шлёт ключ узла и сохраняет кириллицу.`,
  ].join(" ")
  try {
    const res = await fetch(`${core}/api/agents/wake`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Node-Key": key },
      body: JSON.stringify({ service: ownId(), reason: "a2a", text: prompt, from, about: text, declineUrl: `http://127.0.0.1:${port}/api/a2a/tasks/${task.id}` }),
      signal: AbortSignal.timeout(180_000),
    })
    const out = (await res.json().catch(() => ({}))) as { ok?: boolean; pending?: boolean; reason?: string; freeMb?: number; perSessionMb?: number }
    if (out.ok && out.pending) return set("TASK_STATE_SUBMITTED", say("Waiting for the user's confirmation.", "Ожидаем подтверждения пользователя."))
    if (out.ok) return set("TASK_STATE_WORKING", say("The agent is awake and working on the task.", "Агент проснулся и работает над задачей."))
    if (out.reason === "memory") {
      return set("TASK_STATE_SUBMITTED", say(
        `Waiting: not enough free memory to wake the agent (${out.freeMb} MB free, ${out.perSessionMb} MB needed).`,
        `Ожидание: не хватает свободной памяти, чтобы разбудить агента (свободно ${out.freeMb} МБ, нужно ${out.perSessionMb} МБ).`))
    }
    return set("TASK_STATE_SUBMITTED", say(`Waiting: the agent did not start (${out.reason ?? res.status}).`, `Ожидание: агент не запустился (${out.reason ?? res.status}).`))
  } catch (e) {
    return set("TASK_STATE_SUBMITTED", say(`Waiting: the core did not answer (${String((e as Error).message ?? e)}).`, `Ожидание: ядро не ответило (${String((e as Error).message ?? e)}).`))
  }
}

/** Run a code skill; throws an Error with `.reason` when the skill is not served. */
function runSkill(skill: string, input: Json, from: string): unknown {
  if (skill === "catalog-find") return catalogFind(input)
  if (skill === "catalog-get") return catalogGet(input)
  if (skill === "catalog-contribute") return catalogContribute(input, from)
  const lang = typeof input.lang === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(input.lang) ? input.lang : "en"
  if (skill === "site-shell") return { shell: siteShellData(lang), menu: { lang, top: resolveTopGroups(lang), footer: resolveFooterGroups(lang) } }
  if (skill === "redraw-pages") {
    revalidatePath("/", "layout")
    revalidatePath("/[lang]", "layout")
    return { ok: true, revalidated: ["/", "/[lang]"], ts: Date.now() }
  }
  throw Object.assign(new Error(`skill «${skill}» is not served over A2A; see the extension doors of the agent card`), { reason: "UNSUPPORTED_OPERATION" })
}

/** A refusal is a FAILED task with the reason in words and in metadata — the SDK carries only the a2a-protocol.org error domain. */
function failed(task: Task, reason: string, text: string): Task {
  task.status = { state: "TASK_STATE_FAILED", timestamp: now(), message: { messageId: newA2aId(), role: "ROLE_AGENT", parts: [{ text, mediaType: "text/plain" }], metadata: { reason } } }
  return task
}

/** The work of one incoming message — the same rules as before the SDK, now on the SDK's task id and context id. */
function work(ctx: RequestContext): Task {
  const message = SdkMessage.toJSON(ctx.userMessage) as Message
  const from = typeof message.metadata?.from === "string" ? message.metadata.from.slice(0, 64) : "unknown"
  const prior = ctx.task ? (SdkTask.toJSON(ctx.task) as Task) : null
  const task: Task = prior
    ? { ...prior, history: [...(prior.history ?? []), message] }
    : { id: ctx.taskId, contextId: ctx.contextId, history: [message], metadata: { from, createdAt: now() }, status: { state: "TASK_STATE_WORKING", timestamp: now() } }
  const call = message.parts.map((p) => p.data).find((d): d is Json => typeof d === "object" && d !== null && typeof (d as Json).skill === "string")
  if (!call) {
    const text = message.parts.map((p) => p.text).filter((t): t is string => typeof t === "string" && t.trim() !== "").join("\n").trim()
    if (!text) return failed(task, "INVALID_PARAMS", "Send a text part for the agent or a data part { skill, input }.")
    task.metadata = { ...(task.metadata ?? {}), from, kind: "agent" }
    task.status = { state: "TASK_STATE_SUBMITTED", timestamp: now(), message: say("The task is handed to the agent; waking it.", "Задача передана агенту; бужу его.") }
    // After the SDK has saved the task: the wake updates the same task in the store.
    setTimeout(() => void wakeAgent(task, from, text.slice(0, 6000)), 0)
    return task
  }
  try {
    const input = (call.input as Json) ?? {}
    const result = runSkill(String(call.skill), input, from)
    // Outbound guard (step 419-2): a code skill's artifact leaves the element too — a deny sends nothing of it, a mask hides
    // the matches in both the words and the data. The log line carries no content.
    const parts = [...humanParts(String(call.skill), input, result), { data: result, mediaType: "application/json" }]
    const checked = checkOutboundData(parts, loadPolicy(elementRoot()))
    if (checked.rules.length) logGuard(process.env.SERVICE_DATA_DIR, { channel: "skill", verdict: checked.verdict, rules: checked.rules, taskId: task.id, to: from })
    if (checked.verdict === "deny") return failed(task, "OUTBOUND_BLOCKED", `The answer of skill «${String(call.skill)}» was blocked by the element's outbound guard (rules: ${checked.rules.join(", ")}); nothing of it was sent.`)
    task.status = { state: "TASK_STATE_COMPLETED", timestamp: now() }
    task.artifacts = [{ artifactId: newA2aId(), name: String(call.skill), parts: checked.data as typeof parts }]
    return task
  } catch (e) {
    const err = e as Error & { reason?: string }
    return failed(task, err.reason ?? "SKILL_FAILED", String(err.message ?? err))
  }
}

export class ElementExecutor implements AgentExecutor {
  async execute(ctx: RequestContext, bus: ExecutionEventBus): Promise<void> {
    bus.publish(AgentEvent.task(SdkTask.fromJSON(work(ctx))))
    bus.finished()
  }

  // A running executor never outlives `execute` here (it finishes at once), so the SDK cancels from the store by itself.
  async cancelTask(): Promise<void> {}
}
