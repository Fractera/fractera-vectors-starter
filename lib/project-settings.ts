// Без `import "server-only"`: модуль зовёт и `instrumentation.ts`, где условия react-server нет. В браузер его не
// пустит `fs` — клиентская сборка упадёт на импорте.
import { readFileSync, writeFileSync, renameSync, mkdirSync, unlinkSync, existsSync } from "fs"
import { join, dirname } from "path"
import { linkOn } from "./own-site"

// САЙТ — ДОБРОВОЛЬНЫЙ ПОТРЕБИТЕЛЬ ЭЛЕМЕНТА «НАСТРОЙКИ ПРОЕКТА» (шаг 299-6, 2026-09-25).
//
// 🔒 НАСТРОЙКИ САЙТА — ЕГО СОБСТВЕННЫЕ, И ОН ЖИВЁТ БЕЗ ЭЛЕМЕНТА. Слово владельца: «все микро service проекта они могут
// внутри себя просто нарисовать свой заголовок описание создать свою сеу структуру … мы не против … А хочет их
// забирать микро service или не хочет нам вообще неважно». Элемент `config` хранит решения владельца и отдаёт их
// ПО MCP («мы делаем у него MCP также как мы делаем MCP у блоков»); он никого не зовёт. Этот сайт РЕШИЛ их забирать —
// это его выбор, а не обязанность: нет элемента (`CONFIG_SERVICE_URL` пуст) — сайт живёт своими файлами.
//
// Как забирает: при запуске сервера (`instrumentation.ts`) — MCP-команда `settings_version` (отпечаток); отпечаток
// сменился — `get_project_settings` и запись копии. И по сигналу CONFIG после сохранения архитектором (шаг 306, слово
// владельца 2026-09-26): сайт подписан, CONFIG шлёт «версия сменилась» на `/api/settings/changed` — `lib/settings-listener.ts`.
// Таймеров и опроса нет (отменены 2026-09-25): без сигнала правка доходит при следующем запуске.
//
// 🔒 ПОСЛЕДНЯЯ ПОЛУЧЕННАЯ КОПИЯ — ФАЙЛ, А НЕ ПАМЯТЬ ПРОЦЕССА. Элемент недоступен — сайт работает по копии и не теряет
// шапку; перезапуск копию не стирает. Копия лежит в папке данных элемента у узла (`SERVICE_DATA_DIR`), а не рядом с
// кодом: собранный сервер работает из папки сборки, и относительный путь ушёл бы внутрь неё — следующая сборка стёрла
// бы копию (тот же класс, что база входа 260-1 и DESIGN-CONFIG 280-6).
//
// 🔒 ЧИТАТЕЛИ ОСТАЮТСЯ СИНХРОННЫМИ: `getAppConfig` / `getPlatformConfig` / `getDesignConfig` зовут десятки мест; они
// читают копию с диска так же, как раньше читали свой файл.
//
// 🔒 В КОПИИ — ТОЛЬКО РЕШЕНИЯ ВЛАДЕЛЬЦА (`patches`), БЕЗ УМОЛЧАНИЙ ЭЛЕМЕНТА: они ложатся поверх умолчаний САЙТА, и
// «владелец не высказывался» остаётся отличимым от «выбрал то же, что по умолчанию» (`featureDecided`).
// Нет копии — действуют собственные файлы сайта (`APP-CONFIG/…`).

export type SettingsKind = "app" | "platform" | "design"
const KINDS: SettingsKind[] = ["app", "platform", "design"]

type Copy = { receivedAt: string; from: string; version: string; patches: Record<SettingsKind, Record<string, unknown>> }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

export function projectSettingsCopyPath(): string {
  const dir = process.env.SERVICE_DATA_DIR?.trim() || join(process.cwd(), "data")
  return join(dir, "project-settings.json")
}

function readCopy(): Copy | null {
  try {
    const raw = JSON.parse(readFileSync(projectSettingsCopyPath(), "utf8")) as Copy
    return isObj(raw) && isObj(raw.patches) ? raw : null
  } catch {
    return null
  }
}

/**
 * Решения владельца одного вида из последней копии, или `null` — копии нет (элемент ещё ни разу не ответил).
 * `null` значит «читай свой файл», а пустой объект — «владелец ничего не менял»: это разные ответы.
 */
export function projectSettingsPatch(kind: SettingsKind): Record<string, unknown> | null {
  // 324-7: связь с CONFIG выключена — элемент живёт своими файлами.
  if (!linkOn("config")) return null
  const copy = readCopy()
  if (!copy) return null
  const patch = copy.patches[kind]
  return isObj(patch) ? patch : {}
}

// ── MCP-клиент в одну функцию ─────────────────────────────────────────────────
// Сервер элемента — MCP Streamable HTTP без сессий: каждый запрос самостоятелен, `tools/call` идёт без рукопожатия.
// Ответ приходит либо JSON, либо потоком событий (`data: {…}`) — читаются оба вида. Команда, вернувшая `isError`,
// — отказ с её текстом (например, неверный ключ).
export async function callTool(base: string, key: string, name: string, args: Record<string, unknown> = {}): Promise<unknown> {
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

export type PullResult =
  | { ok: true; changed: boolean; version: string }
  | { ok: false; reason: string; detail?: string }

/**
 * Спросить элемент по MCP и, если решения изменились, записать копию. Отказ ничего не стирает: прежняя копия остаётся.
 * `changed` — сменился ли отпечаток (дверь обновления не сбрасывает кэш зря).
 */
export async function pullProjectSettings(): Promise<PullResult> {
  const base = process.env.CONFIG_SERVICE_URL?.trim().replace(/\/+$/, "")
  const key = process.env.SETTINGS_SECRET?.trim()
  // Элемента нет у этого узла — честный ответ, а не сбой: сайт живёт своими файлами.
  if (!base) return { ok: false, reason: "no-config-element" }
  if (!linkOn("config")) return { ok: false, reason: "config-disconnected" }
  if (!key) return { ok: false, reason: "no-settings-key" }

  const before = readCopy()
  let patches: Record<string, unknown>
  let version: string
  try {
    const v = (await callTool(base, key, "settings_version")) as { version?: unknown }
    if (typeof v?.version !== "string") return { ok: false, reason: "bad-answer" }
    if (before && before.version === v.version) return { ok: true, changed: false, version: v.version }
    const got = (await callTool(base, key, "get_project_settings")) as { version?: unknown; patches?: unknown }
    if (typeof got?.version !== "string" || !isObj(got.patches) || !KINDS.every((k) => isObj((got.patches as Record<string, unknown>)[k]))) {
      return { ok: false, reason: "bad-answer" }
    }
    patches = got.patches
    version = got.version
  } catch (err) {
    return { ok: false, reason: "unreachable", detail: err instanceof Error ? err.message : String(err) }
  }

  const copy: Copy = { receivedAt: new Date().toISOString(), from: `${base}/mcp`, version, patches: patches as Copy["patches"] }
  const file = projectSettingsCopyPath()
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  try {
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(tmp, JSON.stringify(copy, null, 2) + "\n", "utf8")
    renameSync(tmp, file) // читатель никогда не видит полузаписанный файл
  } catch (err) {
    if (existsSync(tmp)) try { unlinkSync(tmp) } catch { /* уже нет */ }
    return { ok: false, reason: "write-failed", detail: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, changed: true, version }
}
