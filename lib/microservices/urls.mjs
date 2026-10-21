// Тот же вопрос, что в `urls.ts`, но для файлов `.mjs` — они живут вне
// TypeScript и импортировать `registry.ts` не могут.
//
// 🛑 ДОЛГ, НАЗВАННЫЙ ВСЛУХ: реестр сегодня читают руками ещё два файла —
// `scripts/serve.mjs` и `scripts/health-watch.mjs`. Это третий читатель, и
// сводить их в один надо отдельной работой, а не походя. Пока копий три,
// расходятся они молча.

import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")

function read() {
  try {
    return JSON.parse(readFileSync(path.join(ROOT, "WEB4-ITEMS-REGISTRY", "web4-items.json"), "utf8"))
  } catch {
    return { services: [] }
  }
}

/** Адрес службы по реестру, иначе по окружению, иначе null. */
export function serviceUrlFor(id) {
  const entry = (read().services ?? []).find((s) => s.id === id)
  if (entry && typeof entry.port === "number") return `http://127.0.0.1:${entry.port}`
  const env = id === "auth" ? process.env.AUTH_SERVICE_URL : process.env.REMOTE_DATA_URL
  return env && env.trim() ? env.trim().replace(/\/+$/, "") : null
}
