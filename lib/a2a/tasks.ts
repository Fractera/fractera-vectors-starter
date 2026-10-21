import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"

// ЗАДАЧИ A2A — В ПАПКЕ ДАННЫХ ЭЛЕМЕНТА, А НЕ В ПАМЯТИ ПРОЦЕССА (шаг узла 409-2). Задача для агента живёт минуты и часы: агент
// просыпается, работает, отвечает — а элемент за это время могут развернуть заново. Память процесса этого не переживает, файл
// переживает. `SERVICE_DATA_DIR/a2a/tasks/<id>.json`; хранятся последние 200.

export type Json = Record<string, unknown>
export type Part = { text?: string; data?: unknown; mediaType?: string; metadata?: Json }
export type Message = { messageId: string; role: string; parts: Part[]; contextId?: string; taskId?: string; metadata?: Json }
export type Task = {
  id: string; contextId: string
  status: { state: string; timestamp: string; message?: Message }
  artifacts?: { artifactId: string; name: string; parts: Part[] }[]
  history?: Message[]
  metadata?: Json
}

const KEEP = 200
const MEMORY = new Map<string, Task>()

function dir(): string | null {
  const base = process.env.SERVICE_DATA_DIR?.trim()
  if (!base) return null
  const d = join(base, "a2a", "tasks")
  mkdirSync(d, { recursive: true })
  return d
}

const safe = (id: string) => /^[A-Za-z0-9-]{1,64}$/.test(id)

export function saveTask(t: Task): void {
  const d = dir()
  if (!d) {
    MEMORY.set(t.id, t)
    if (MEMORY.size > KEEP) MEMORY.delete(MEMORY.keys().next().value as string)
    return
  }
  writeFileSync(join(d, `${t.id}.json`), JSON.stringify(t, null, 2))
  const files = readdirSync(d).filter((f) => f.endsWith(".json"))
  if (files.length > KEEP) {
    files
      .map((f) => ({ f, at: statSync(join(d, f)).mtimeMs }))
      .sort((a, b) => a.at - b.at)
      .slice(0, files.length - KEEP)
      .forEach(({ f }) => unlinkSync(join(d, f)))
  }
}

export function getTask(id: string): Task | null {
  if (!safe(id)) return null
  const d = dir()
  if (!d) return MEMORY.get(id) ?? null
  const file = join(d, `${id}.json`)
  if (!existsSync(file)) return null
  try { return JSON.parse(readFileSync(file, "utf8")) as Task } catch { return null }
}

/** Новые сверху. */
export function listTasks(contextId?: string): Task[] {
  const d = dir()
  const all = d
    ? readdirSync(d)
        .filter((f) => f.endsWith(".json"))
        .map((f) => ({ f, at: statSync(join(d, f)).mtimeMs }))
        .sort((a, b) => b.at - a.at)
        .map(({ f }) => getTask(f.slice(0, -5)))
        .filter((t): t is Task => t !== null)
    : [...MEMORY.values()].reverse()
  return contextId ? all.filter((t) => t.contextId === contextId) : all
}
