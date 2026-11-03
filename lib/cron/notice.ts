import { coreUrl } from "../a2a/log"
import { type CronSchedule } from "./due"
import { elementId } from "./wake"

// УВЕДОМЛЕНИЕ В ГЛАВНЫЙ ЧАТ (шаг узла 636-8). Владелец узла 2026-11-03: «события крон должны приходить не затрагивая искусственный
// интеллект независимо от происходящих процессов оно просто должно всплыть по расписанию и всё»; выбор — «Дверь ядра «уведомление»
// (Рекомендую)». В свою минуту часы зовут дверь ядра `/api/node/notice` с ключом узла: ядро шлёт ботом главного агента «⏰ Напоминание ·
// <имя этого элемента>» и слова записи цитатой. Это API, о котором агенты договорились один раз (закон «Only agents talk to agents»):
// код зовёт его напрямую, ни один агент и ни одна модель в эту минуту не участвуют.

export async function noticeMainChat(s: CronSchedule): Promise<{ ok: boolean; detail: string }> {
  const text = s.message?.trim()
  if (!text) return { ok: false, detail: "no message text" }
  const me = elementId()
  const core = coreUrl()
  const key = process.env.SETTINGS_SECRET?.trim()
  if (!me) return { ok: false, detail: "this element has no id (OWN-SERVICE-PROPS.json → id)" }
  if (!core) return { ok: false, detail: "the core's address is unknown (NODE_DOMAIN_FILE → logs/runtime.json)" }
  if (!key) return { ok: false, detail: "no node key (SETTINGS_SECRET)" }
  try {
    const r = await fetch(`${core}/api/node/notice`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-node-key": key },
      body: JSON.stringify({ from: me, kind: "reminder", text }),
      signal: AbortSignal.timeout(20_000),
    })
    const b = (await r.json().catch(() => ({}))) as { ok?: boolean; detail?: string; reason?: string }
    return b.ok ? { ok: true, detail: `main chat: ${b.detail ?? "sent"}` } : { ok: false, detail: `the core answered ${r.status}: ${b.reason ?? b.detail ?? "no reason"}` }
  } catch (e) {
    return { ok: false, detail: `the core did not answer: ${(e as Error).message}` }
  }
}
