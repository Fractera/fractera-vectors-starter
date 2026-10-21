import { readFileSync } from "node:fs"
import { join } from "node:path"

// СООБЩЕНИЕ В TELEGRAM БОТА ЭЛЕМЕНТА (шаг 465; владелец 2026-10-12 на вопрос о почте: «to telegram»).
// Бот элемента — `SERVICE_DATA_DIR/channel/telegram`: `.env` с `TELEGRAM_BOT_TOKEN`, `access.json` с `allowFrom` (ту же папку
// читает визитка `app/.well-known/agent-card.json` и ядро). Отправка `sendMessage` опросу плагина каналов (`getUpdates`) не
// мешает (закон 408-5). Токен никуда не выходит, кроме api.telegram.org.

const dir = () => {
  const d = process.env.SERVICE_DATA_DIR?.trim()
  return d ? join(d, "channel", "telegram") : null
}

function token(): string {
  const d = dir()
  if (!d) return ""
  try {
    const line = readFileSync(join(d, ".env"), "utf8").split(/\r?\n/).find((l) => l.startsWith("TELEGRAM_BOT_TOKEN="))
    return line ? line.slice("TELEGRAM_BOT_TOKEN=".length).trim() : ""
  } catch {
    return ""
  }
}

function allowed(): string[] {
  const d = dir()
  if (!d) return []
  try {
    const a = JSON.parse(readFileSync(join(d, "access.json"), "utf8")) as { allowFrom?: unknown }
    return Array.isArray(a.allowFrom) ? a.allowFrom.map(String) : []
  } catch {
    return []
  }
}

/** Язык человека бота — как у ядра (411): `person.json`, иначе кириллица системных текстов → ru, иначе en. */
export function personLang(): "ru" | "en" {
  const d = dir()
  if (!d) return "en"
  try {
    const p = JSON.parse(readFileSync(join(d, "person.json"), "utf8")) as { lang?: unknown }
    if (typeof p.lang === "string") return p.lang.startsWith("ru") ? "ru" : "en"
  } catch { /* нет файла */ }
  try {
    return /[а-яё]/i.test(readFileSync(join(d, "messages.json"), "utf8")) ? "ru" : "en"
  } catch {
    return "en"
  }
}

/** Отправить текст каждому допущенному. Ответ — для журнала запусков. */
export async function sendToOwner(text: string): Promise<{ ok: boolean; detail: string }> {
  const t = token()
  const to = allowed()
  if (!t || !to.length) return { ok: false, detail: "telegram bot not connected" }
  const sent: string[] = []
  for (const chat of to) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text }),
        signal: AbortSignal.timeout(15_000),
      })
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; result?: { message_id?: number }; description?: string }
      if (!j.ok) return { ok: false, detail: `telegram: ${j.description ?? r.status}` }
      sent.push(String(j.result?.message_id ?? "?"))
    } catch (e) {
      return { ok: false, detail: `telegram: ${(e as Error).message}` }
    }
  }
  return { ok: true, detail: `telegram message_id ${sent.join(", ")}` }
}
