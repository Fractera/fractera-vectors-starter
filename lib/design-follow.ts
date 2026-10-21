// ДИЗАЙН ПРОЕКТА — ИЗ ЭЛЕМЕНТА «ДИЗАЙН», НА ЛЕТУ (узел, шаг 309; слово владельца 2026-09-26: «любые микро сервисы … будут
// менять свой дизайн а именно цвет шрифты отступы скругления … в тот момент когда микро сервис дизайн будет вносить изменения»).
//
// Служба берёт у элемента `design` решения владельца об оформлении — цвета (светлая и тёмная тема), шрифты, текст, формы и
// настройки блоков — и кладёт их в свой `DESIGN-CONFIG`. Когда: при старте (`instrumentation.ts`) и по сигналу «версия
// сменилась» (`/api/settings/changed`), после чего страницы перерисовываются без пересборки.
// 🔒 Сигнал — не настройки: служба забирает их сама по MCP. Таймеров и опроса нет — только ответ на сохранение человеком.
// 🔒 Файл целиком в руках элемента «Дизайн»: ветки, которых владелец не решал, убираются — действует тема службы. Так правка,
// снятая в «Дизайне», снимается и здесь.
// Элемента нет (`DESIGN_SERVICE_URL` пуст) — служба живёт своим `DESIGN-CONFIG`.
import { readFileSync, writeFileSync, renameSync, mkdirSync, unlinkSync, existsSync } from "fs"
import { dirname, join } from "path"
import { linkOn } from "./own-site"
import { timingSafeEqual } from "crypto"

const BRANCHES = ["colors", "fonts", "type", "shape", "blocks"] as const
const designPath = () => process.env.DESIGN_CONFIG_PATH ?? join(process.cwd(), "DESIGN-CONFIG", "design-config.json")
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const base = process.env.DESIGN_SERVICE_URL?.trim().replace(/\/+$/, "")
  const key = process.env.SETTINGS_SECRET?.trim()
  if (!base) throw new Error("no-design-element")
  if (!key) throw new Error("no-settings-key")
  const res = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "x-settings-key": key },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`http-${res.status}`)
  const text = await res.text()
  const line = text.trimStart().startsWith("{") ? text : text.split("\n").find((l) => l.startsWith("data:"))?.slice(5) ?? ""
  const msg = JSON.parse(line) as { result?: { isError?: boolean; content?: { type: string; text: string }[] }; error?: { message?: string } }
  if (msg.error) throw new Error(`mcp: ${msg.error.message ?? "error"}`)
  const out = msg.result?.content?.find((c) => c.type === "text")?.text ?? ""
  if (msg.result?.isError) throw new Error(out || "tool-error")
  return JSON.parse(out)
}

export type DesignFollowResult = { ok: true; changed: boolean } | { ok: false; reason: string }

/** Забрать решения владельца об оформлении у элемента «Дизайн» и записать в свой DESIGN-CONFIG. Отказ ничего не стирает. */
export async function pullDesign(): Promise<DesignFollowResult> {
  // 324-7: связь с «Дизайном» выключена — оформление остаётся своим.
  if (!linkOn("design")) return { ok: false, reason: "design-disconnected" }
  let patch: Record<string, unknown>
  try {
    const got = (await callTool("get_project_settings", { kind: "design" })) as { patches?: { design?: unknown } }
    if (!isObj(got?.patches?.design)) return { ok: false, reason: "bad-answer" }
    patch = got.patches.design
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  }
  const file = designPath()
  let current: Record<string, unknown> = {}
  try { const p = JSON.parse(readFileSync(file, "utf8")); if (isObj(p)) current = p } catch { /* файла нет — тема службы */ }
  const next: Record<string, unknown> = { ...current }
  for (const b of BRANCHES) {
    if (isObj(patch[b]) && Object.keys(patch[b] as object).length) next[b] = patch[b]
    else delete next[b]
  }
  if (JSON.stringify(next) === JSON.stringify(current)) return { ok: true, changed: false }
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  try {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(tmp, JSON.stringify(next, null, 2) + "\n", "utf8")
    renameSync(tmp, file)
  } catch (err) {
    if (existsSync(tmp)) try { unlinkSync(tmp) } catch { /* уже нет */ }
    return { ok: false, reason: `write-failed: ${err instanceof Error ? err.message : err}` }
  }
  return { ok: true, changed: true }
}

/** Подписаться на сигнал элемента «Дизайн». Зовётся при каждом старте: у элемента одна запись на службу. */
export async function subscribeToDesign(who: string): Promise<{ ok: boolean; reason?: string; url?: string }> {
  const port = Number(process.env.PORT)
  if (!Number.isInteger(port) || port <= 0) return { ok: false, reason: "no-port" }
  const url = `http://127.0.0.1:${port}/api/settings/changed`
  try {
    await callTool("subscribe", { url, who })
    return { ok: true, url }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  }
}

/** Сигнал пришёл с ключом узла? */
export function signalKeyOk(given: string | null): boolean {
  const expected = process.env.SETTINGS_SECRET ?? ""
  const g = given ?? ""
  if (!expected || g.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(g), Buffer.from(expected))
}
