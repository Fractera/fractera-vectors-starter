import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { coreUrl } from "../a2a/log"
import { ownId } from "../own-id"
import { elementDir, type CronSchedule } from "./due"

// БУДИЛЬНИК: ЧАСЫ БУДЯТ СВОЕГО АГЕНТА (шаг узла 636). Владелец узла 2026-11-03: «Нашей архитектуре никто не может взаимодействовать
// с какими-либо агентами кроме самих агентов … Если тебе что-то нужно сделать внутри элемента то это взаимодействие где это что-то
// общается с агентом этого элемента а уже агент элемента вызывает процессы для взаимодействия с другими агентами».
// 🔒 Код часов говорит только со СВОИМ агентом: дверь ядра `/api/agents/wake` с ключом узла, `service` = `from` = id этого элемента,
// `reason: "alarm"` — без вопроса человеку (владелец: «Не спрашивать»). Ядро отказывает будильнику для чужого агента. Слова для
// человека агент передаёт оркестратору сам — `npm run tell-core -- --alarm "…"`; ни чужого бота, ни чужой двери у часов нет.
// Первое слово — процесс сессии: у элемента с рабочим процессом (`.claude/modes/work.md`) — «Working process:», у нативного —
// «Build process:» (551-1: у нативного элемента одна сессия).

export function elementId(): string | null {
  try {
    const p = JSON.parse(readFileSync(join(elementDir(), "OWN-SERVICE-PROPS", "OWN-SERVICE-PROPS.json"), "utf8")) as { id?: unknown }
    if (typeof p.id === "string" && p.id.trim()) return p.id.trim()
  } catch { /* паспорта нет в папке элемента — имя из окружения */ }
  return ownId()
}

/** Текст пробуждения: что сработало и что с этим делать. Английский — слой для агента; слова человека — как он их сказал. */
export function alarmText(s: CronSchedule): string {
  const word = existsSync(join(elementDir(), ".claude", "modes", "work.md")) ? "Working process:" : "Build process:"
  const said = s.saidAt ? `, set ${s.saidAt}` : ""
  return `${word} Your alarm fired — the calendar entry «${s.name ?? s.id}» (id ${s.id}${said}; ${s.start} ${s.time}, repeat ${s.repeat}). ` +
    `Its words: «${(s.message ?? "").trim()}». Do what the entry asks. Words for the person go to the core's main agent: ` +
    `npm run tell-core -- --alarm "<the words>" (skill schedule-cron-automations-calendar-reminders-recurring-and-one-time-tasks). ` +
    "Nothing else: no plan, no build. Then finish as usual."
}

/** Разбудить своего агента. Ответ — для журнала запусков (`data/cron-runs.jsonl`): календарь ядра покажет его. */
export async function wakeOwnAgent(s: CronSchedule): Promise<{ ok: boolean; detail: string }> {
  if (!s.message?.trim()) return { ok: false, detail: "no message text" }
  const me = elementId()
  const core = coreUrl()
  const key = process.env.SETTINGS_SECRET?.trim()
  if (!me) return { ok: false, detail: "this element has no id (OWN-SERVICE-PROPS.json → id)" }
  if (!core) return { ok: false, detail: "the core's address is unknown (NODE_DOMAIN_FILE → logs/runtime.json)" }
  if (!key) return { ok: false, detail: "no node key (SETTINGS_SECRET)" }
  try {
    const r = await fetch(`${core}/api/agents/wake`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-node-key": key },
      body: JSON.stringify({ service: me, from: me, reason: "alarm", about: `alarm: ${s.name ?? s.id}`.slice(0, 300), text: alarmText(s) }),
      signal: AbortSignal.timeout(30_000),
    })
    const b = (await r.json().catch(() => ({}))) as { ok?: boolean; pending?: boolean; already?: boolean; queued?: string; reason?: string; freeMb?: number; perSessionMb?: number }
    if (!b.ok) return { ok: false, detail: `the core answered ${r.status}: ${b.reason ?? "no reason"}${b.reason === "memory" ? ` (free ${b.freeMb} MB, a session needs ${b.perSessionMb} MB)` : ""}` }
    return { ok: true, detail: b.pending ? "the person is asked in Telegram first (the core has no alarm door yet)" : b.already ? "pasted into the agent's live session" : b.queued ? `queued after the ${b.queued} pass` : "the agent woke" }
  } catch (e) {
    return { ok: false, detail: `the core did not answer: ${(e as Error).message}` }
  }
}
