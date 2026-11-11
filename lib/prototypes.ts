import "server-only"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { branchDir } from "@/lib/page-tree"
import { buildDesignCss, prototypeScope } from "@/lib/design-css"
import { validateConfig } from "@/config/config-validate"
import { designConfigSchema } from "@/config/design-config.schema"
import { DEFAULT_DESIGN_CONFIG, type DesignConfig } from "@/config/design-config.defaults"

// ПРОТОТИПЫ ДИЗАЙНА (узел, шаг 711-4). Владелец 2026-11-09: «тестовой страницы сохраняются в проекте с ссылкой но … не в публичном
// пространстве а защищенном пространстве и архитектора … прямо в шаблоне изначально раздел прототипы дизайна».
// Прототип — папка данных `prototypes/_pages/<id>/`: слова страницы (`en.json`, `ru.json`, `meta.json`) — как у любой страницы ветки,
// `tokens.json` — СВОЯ копия документа дизайна (форма `DESIGN-CONFIG`), `DESIGN.md` — правила облика, которые токенами не выразить,
// `prototype.json` — навык, исходная страница, референсы, статус. Токены первыми, страница второй: страница прототипа берёт цвета,
// шрифты и отступы только из своей копии, и при «Закрепить» эта копия становится `DESIGN-CONFIG/design-config.json` элемента
// (`npm run design:pin`). Читается во время работы — новый прототип виден без пересборки; его свои секции (`<id>/sections/`, 717-3) —
// код и видны после сборки.

export const PROTOTYPE_ID = /^[a-z0-9][a-z0-9-]{0,47}$/
export type PrototypeStatus = "draft" | "ready" | "pinned" | "archived"
export type PrototypeRef = { url: string; caption?: string }
export type Prototype = {
  id: string
  skill: string
  from: string
  references: PrototypeRef[]
  status: PrototypeStatus
  createdAt: string
  readyAt?: string
  title?: string
}

const pagesDir = () => join(branchDir("(protectedLayer)", "prototypes"), "_pages")

/** Папка прототипа или null — имя проверяется до любого пути. */
export function prototypeDir(id: string): string | null {
  return PROTOTYPE_ID.test(id) ? join(pagesDir(), id) : null
}

function readJson<T>(file: string): T | null {
  try { return JSON.parse(readFileSync(file, "utf8")) as T } catch { return null }
}

export function readPrototype(id: string): Prototype | null {
  const dir = prototypeDir(id)
  if (!dir) return null
  const p = readJson<Prototype>(join(dir, "prototype.json"))
  return p && p.id === id ? p : null
}

/** Все прототипы элемента, новые первыми. */
export function listPrototypes(): Prototype[] {
  const root = pagesDir()
  if (!existsSync(root)) return []
  return readdirSync(root)
    .filter((n) => PROTOTYPE_ID.test(n) && statSync(join(root, n)).isDirectory())
    .map((n) => readPrototype(n))
    .filter((p): p is Prototype => p !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Копия токенов прототипа — той же проверкой, что и документ дизайна элемента. */
export function prototypeTokens(id: string): DesignConfig | null {
  const dir = prototypeDir(id)
  const raw = dir ? readJson<Partial<DesignConfig>>(join(dir, "tokens.json")) : null
  if (!raw) return null
  const merged: DesignConfig = {
    colors: { light: raw.colors?.light ?? {}, dark: raw.colors?.dark ?? {} },
    fonts: raw.fonts ?? {},
    type: raw.type ?? {},
    shape: raw.shape ?? {},
    motion: raw.motion ?? {},
  }
  return validateConfig(designConfigSchema, merged, DEFAULT_DESIGN_CONFIG, `PROTOTYPE ${id}`)
}

/** CSS прототипа, действующий только на его странице, и его шрифты. */
export function prototypeStyle(id: string): { css: string; fontLinks: string[] } | null {
  const tokens = prototypeTokens(id)
  return tokens ? buildDesignCss(tokens, prototypeScope(id)) : null
}
