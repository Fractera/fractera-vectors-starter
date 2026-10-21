// Guard of the PRODUCT QUIZ (node step 536-4). Run: npm run check:product  (or: node scripts/check-product.mjs --root <element dir>).
//
// The quiz (`development-docs/product/`) is written by the agent with the person (skill `product-quiz`) and drawn by the core's page
// «Building → Product design → Product quiz». This guard checks what the page and the agent rely on:
// 1. the files: `quiz.json` is JSON, every module named in `modules` has its `modules/<slug>.json`;
// 2. numbers: every item has a number of its kind (`S-NN` scenario · `R-NN` rule · `E-NN` entity), no number is used twice;
// 3. links: `dependsOn` and the `about` of open questions and the `items` of slices point at existing items, and dependencies do
//    not run in a circle;
// 4. confirmation: a `confirmed` item carries `confirmed.date` and `confirmed.said` — the person's words, never the agent's;
// 5. steps: every `Serves:` line in `steps-new/`, `steps-done/` and `current-step.md` names existing items (or `none`).
// No quiz yet → nothing to check, exit 0. Not in `prebuild`: a broken quiz must not stop the site from being deployed.
//
// What it does not see: whether the words are product words, whether an item is true, whether the person really said «yes».

import fs from "node:fs"
import path from "node:path"

const argRoot = process.argv.indexOf("--root")
const ROOT = argRoot > 0 ? path.resolve(process.argv[argRoot + 1]) : path.resolve(import.meta.dirname, "..")
const DOCS = path.join(ROOT, "development-docs")
const DIR = path.join(DOCS, "product")
const problems = []
const ID = { scenario: /^S-\d{2,}$/, rule: /^R-\d{2,}$/, entity: /^E-\d{2,}$/ }
const ANY_ITEM = /^[SRE]-\d{2,}$/
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/

const read = (p) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"))
  } catch (e) {
    problems.push(`${path.relative(ROOT, p).replaceAll("\\", "/")}: ${e instanceof Error ? e.message : e}`)
    return null
  }
}

if (!fs.existsSync(path.join(DIR, "quiz.json"))) {
  console.log("check:product — no product quiz yet (development-docs/product/quiz.json), nothing to check")
  process.exit(0)
}

const quiz = read(path.join(DIR, "quiz.json"))
const items = []
if (quiz) {
  for (const slug of Array.isArray(quiz.modules) ? quiz.modules : []) {
    if (!SLUG.test(slug)) { problems.push(`modules: «${slug}» is not a valid file name`); continue }
    const file = path.join(DIR, "modules", `${slug}.json`)
    if (!fs.existsSync(file)) { problems.push(`modules: «${slug}» is listed, but modules/${slug}.json is missing`); continue }
    const m = read(file)
    for (const it of Array.isArray(m?.items) ? m.items : []) items.push({ ...it, module: slug })
  }
  for (const f of fs.existsSync(path.join(DIR, "modules")) ? fs.readdirSync(path.join(DIR, "modules")) : []) {
    if (f.endsWith(".json") && !(quiz.modules ?? []).includes(f.slice(0, -5))) problems.push(`modules/${f} exists but is not listed in quiz.json «modules»`)
  }
}

const ids = new Set()
for (const it of items) {
  const where = `${it.module}: ${it.id ?? "(no number)"}`
  const kind = it.kind ?? "scenario"
  if (!ID[kind]) problems.push(`${where} — unknown kind «${kind}»`)
  else if (!ID[kind].test(it.id ?? "")) problems.push(`${where} — a ${kind} is numbered ${kind[0].toUpperCase()}-NN`)
  if (ids.has(it.id)) problems.push(`${where} — the number is used twice`)
  ids.add(it.id)
  if (it.status !== "draft" && it.status !== "confirmed") problems.push(`${where} — status is «draft» or «confirmed», not «${it.status}»`)
  if (it.status === "confirmed" && !(it.confirmed?.date && it.confirmed?.said)) problems.push(`${where} — confirmed without the date and the person's words`)
  for (const d of Array.isArray(it.dependsOn) ? it.dependsOn : []) if (!items.some((x) => x.id === d)) problems.push(`${where} — depends on ${d}, which is not in the quiz`)
}

// Dependencies must not run in a circle: a circle has no item to build first.
const deps = new Map(items.map((it) => [it.id, Array.isArray(it.dependsOn) ? it.dependsOn : []]))
const state = new Map()
const visit = (id, trail) => {
  if (state.get(id) === "done") return
  if (state.get(id) === "open") { problems.push(`dependencies run in a circle: ${[...trail.slice(trail.indexOf(id)), id].join(" → ")}`); return }
  state.set(id, "open")
  for (const d of deps.get(id) ?? []) if (deps.has(d)) visit(d, [...trail, id])
  state.set(id, "done")
}
for (const id of deps.keys()) visit(id, [])

for (const q of Array.isArray(quiz?.openQuestions) ? quiz.openQuestions : [])
  for (const a of Array.isArray(q.about) ? q.about : []) if (ANY_ITEM.test(a) && !ids.has(a)) problems.push(`open question ${q.id}: about ${a}, which is not in the quiz`)
for (const s of Array.isArray(quiz?.slices) ? quiz.slices : [])
  for (const a of Array.isArray(s.items) ? s.items : []) if (!ids.has(a)) problems.push(`slice ${s.id}: ${a} is not in the quiz`)

// Steps name the items they serve in one line `Serves: …` (skill use-development-docs); the core draws the dots from it.
const SERVES = /^[\s>*_-]*serves[*_]*\s*:[*_]*\s*(.+)$/im
const stepFiles = [
  ...["steps-new", "steps-done"].flatMap((d) => (fs.existsSync(path.join(DOCS, d)) ? fs.readdirSync(path.join(DOCS, d)).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => path.join(DOCS, d, f)) : [])),
  path.join(DOCS, "current-step.md"),
]
for (const f of stepFiles) {
  if (!fs.existsSync(f)) continue
  const m = SERVES.exec(fs.readFileSync(f, "utf8"))
  if (!m) continue
  for (const ref of m[1].split(/[\s,;]+/).map((s) => s.replace(/[`*]/g, "")).filter(Boolean)) {
    if (ref.toLowerCase() === "none") continue
    if (!ANY_ITEM.test(ref) || !ids.has(ref)) problems.push(`${path.relative(ROOT, f).replaceAll("\\", "/")}: Serves ${ref}, which is not in the quiz`)
  }
}

if (problems.length) {
  console.error(`===PRODUCT_QUIZ_FAIL=== ${problems.length} problem(s):`)
  for (const p of problems) console.error("  " + p)
  process.exit(1)
}
console.log(`===PRODUCT_QUIZ_OK=== ${items.length} items in ${(quiz?.modules ?? []).length} modules, ${(quiz?.openQuestions ?? []).length} open questions`)
