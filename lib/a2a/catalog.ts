import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs"
import { join } from "node:path"

// КАТАЛОГ ЭЛЕМЕНТА — УРОВНИ 3–4 СТАНДАРТА A2A УЗЛА (шаг 406-7). Сценарий владельца: этот элемент играет будущие «Блоки».
// Каталог стартует пустым; сосед спрашивает «есть секция hero?» (`catalog-find`), получает «нет», делает секцию сам и отдаёт
// на сохранение (`catalog-contribute`); элемент заводит раздел и кладёт версию 1; в следующий раз её находят и забирают
// (`catalog-get`).
//
// Единица — элемент реестра shadcn (`name`, `type: "registry:block"`, `files[].content`) плюс поля узла: раздел, название,
// слова, теги, схема полей, пример данных, происхождение, версия. Поэтому сохранённое ставится в любой элемент обычным
// `shadcn add`. Хранится в папке данных элемента (`SERVICE_DATA_DIR/catalog/<раздел>/<имя>/v<N>.json`), не в коде:
// переживает пересборку. Вклад никогда не затирает — повтор адреса = следующая версия.

type Json = Record<string, unknown>
export type CatalogFile = { path: string; content: string; type: string }
export type CatalogUnit = {
  address: string; section: string; name: string
  type: "registry:block"
  title: string; words: string; tags: string[]
  schema: Json; example: Json
  files: CatalogFile[]
  origin: { element: string; at: string }
  version: number
}

const KEBAB = /^[a-z0-9][a-z0-9-]{0,60}$/
const MAX_FILE = 100_000
const MAX_FILES = 10

function root(): string {
  const dir = process.env.SERVICE_DATA_DIR?.trim()
  if (!dir) throw Object.assign(new Error("catalog storage is not configured (SERVICE_DATA_DIR)"), { code: -32603, reason: "NO_STORAGE" })
  return join(dir, "catalog")
}
const refuse = (message: string) => Object.assign(new Error(message), { code: -32602, reason: "CONTRIBUTION_REFUSED" })

function versions(dir: string): number[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).map((f) => /^v(\d+)\.json$/.exec(f)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b)
}

function readUnit(section: string, name: string, version?: number): CatalogUnit | null {
  const dir = join(root(), section, name)
  const all = versions(dir)
  const v = version ?? all[all.length - 1]
  if (!v || !all.includes(v)) return null
  return JSON.parse(readFileSync(join(dir, `v${v}.json`), "utf8")) as CatalogUnit
}

/** Все единицы каталога (последние версии). */
function allUnits(): CatalogUnit[] {
  const base = root()
  if (!existsSync(base)) return []
  const out: CatalogUnit[] = []
  for (const section of readdirSync(base)) {
    const sdir = join(base, section)
    if (!KEBAB.test(section) || !existsSync(join(sdir, "section.json"))) continue
    for (const name of readdirSync(sdir)) {
      if (!KEBAB.test(name)) continue
      const u = readUnit(section, name)
      if (u) out.push(u)
    }
  }
  return out
}

const summary = (u: CatalogUnit) => ({ address: u.address, section: u.section, title: u.title, words: u.words, tags: u.tags, version: u.version, origin: u.origin })

/** Найти: до 10 единиц по словам запроса (раздел, имя, теги весят больше слов описания). Пусто — честное «нет». */
export function catalogFind(input: Json) {
  const query = String(input.query ?? "").toLowerCase()
  const words = query.split(/[^\p{L}\p{N}-]+/u).filter((w) => w.length > 1)
  const sections = existsSync(root()) ? readdirSync(root()).filter((s) => existsSync(join(root(), s, "section.json"))) : []
  if (!words.length) return { units: allUnits().slice(0, 10).map(summary), sections }
  const scored = allUnits()
    .map((u) => {
      const keys = new Set([u.section, u.name, ...u.tags].map((t) => t.toLowerCase()))
      const text = `${u.title} ${u.words}`.toLowerCase()
      const score = words.reduce((n, w) => n + (keys.has(w) ? 3 : 0) + (text.includes(w) ? 1 : 0), 0)
      return { u, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
  return { units: scored.map((x) => summary(x.u)), sections, found: scored.length > 0 }
}

/** Получить: полная единица по адресу `<раздел>/<имя>` (версия — последняя или названная). */
export function catalogGet(input: Json) {
  const [section, name] = String(input.address ?? "").split("/")
  if (!KEBAB.test(section ?? "") || !KEBAB.test(name ?? "")) throw refuse("address must be <section>/<name>")
  const unit = readUnit(section, name, typeof input.version === "number" ? input.version : undefined)
  if (!unit) throw Object.assign(new Error(`no unit ${section}/${name}`), { code: -32000, reason: "UNIT_NOT_FOUND" })
  return { unit }
}

/** Внести: проверить присланное, завести раздел при надобности, положить следующую версию. Ничего не затирает. */
export function catalogContribute(input: Json, from: string) {
  const u = (input.unit ?? {}) as Json
  const section = String(u.section ?? "")
  const name = String(u.name ?? "")
  if (!KEBAB.test(section)) throw refuse("unit.section must be kebab-case (e.g. hero)")
  if (!KEBAB.test(name)) throw refuse("unit.name must be kebab-case (e.g. hero-centered)")
  if (typeof u.title !== "string" || !u.title.trim()) throw refuse("unit.title is required")
  if (typeof u.words !== "string" || u.words.trim().length < 10) throw refuse("unit.words: one or two plain sentences are required")
  if (!Array.isArray(u.tags) || u.tags.length === 0 || !u.tags.every((t) => typeof t === "string")) throw refuse("unit.tags is required")
  if (typeof u.schema !== "object" || u.schema === null) throw refuse("unit.schema (fields of the block) is required")
  if (typeof u.example !== "object" || u.example === null) throw refuse("unit.example (a filled example) is required")
  const files = Array.isArray(u.files) ? (u.files as CatalogFile[]) : []
  if (files.length === 0 || files.length > MAX_FILES) throw refuse(`unit.files: 1–${MAX_FILES} files are required`)
  for (const f of files) {
    if (typeof f?.path !== "string" || !/^[A-Za-z0-9_./-]+$/.test(f.path) || f.path.includes("..") || f.path.startsWith("/")) throw refuse(`file path «${f?.path}» is not a safe relative path`)
    if (typeof f.content !== "string" || f.content.length === 0 || f.content.length > MAX_FILE) throw refuse(`file ${f.path}: content must be 1–${MAX_FILE} characters`)
  }
  const sdir = join(root(), section)
  const createdSection = !existsSync(join(sdir, "section.json"))
  if (createdSection) {
    mkdirSync(sdir, { recursive: true })
    writeFileSync(join(sdir, "section.json"), JSON.stringify({ section, createdAt: new Date().toISOString(), by: from }, null, 2) + "\n")
  }
  const udir = join(sdir, name)
  mkdirSync(udir, { recursive: true })
  const all = versions(udir)
  const version = (all[all.length - 1] ?? 0) + 1
  const unit: CatalogUnit = {
    address: `${section}/${name}`, section, name, type: "registry:block",
    title: String(u.title).trim(), words: String(u.words).trim(), tags: (u.tags as string[]).map((t) => t.trim()),
    schema: u.schema as Json, example: u.example as Json,
    files: files.map((f) => ({ path: f.path, content: f.content, type: typeof f.type === "string" ? f.type : "registry:component" })),
    origin: { element: from, at: new Date().toISOString() },
    version,
  }
  const file = join(udir, `v${version}.json`)
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, JSON.stringify(unit, null, 2) + "\n")
  renameSync(tmp, file)
  return { status: "accepted", address: unit.address, version, createdSection }
}
