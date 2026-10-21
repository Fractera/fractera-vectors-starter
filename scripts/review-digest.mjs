// ВЫЖИМКА СЕССИИ АГЕНТА ДЛЯ РАЗБОРА (шаг узла 410-1; владелец 2026-10-06: «получить все текущую переписку анализ сопоставить её с
// имеющемся навыком»). Читает файл сессии Claude Code этого элемента — `~/.claude/projects/<папка элемента>/<сессия>.jsonl`, самый
// свежий или `--session <id>` — и печатает коротко то, на что опирается разбор (навык `self-review`): какие навыки загружались,
// где команда упала и что было дальше, какие команды повторялись, что сказал человек (терминал, Telegram) и что было вставлено
// задачей. Сырой файл — сотни килобайт; агент читает эту выжимку, а не его. Только чтение.
//
//   npm run review:digest                      # последняя сессия
//   npm run review:digest -- --session <id>    # конкретная
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const CUT = 220
const cut = (t, n = CUT) => {
  const s = String(t ?? "").replace(/\s+/g, " ").trim()
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

// Папка проектов Claude Code называется путём рабочей папки, где всё, кроме букв и цифр, заменено на «-» (измерено:
// C:\Users\…\WEB4-ITEMS\user\roman → C--Users-…-WEB4-ITEMS-user-roman).
const dir = join(homedir(), ".claude", "projects", process.cwd().replace(/[^A-Za-z0-9]/g, "-"))
const arg = process.argv.indexOf("--session")
const wanted = arg > 0 ? process.argv[arg + 1] : ""

if (!existsSync(dir)) {
  console.error(`Нет папки сессий агента этого элемента: ${dir}`)
  process.exit(1)
}
const files = readdirSync(dir).filter((f) => f.endsWith(".jsonl"))
let file = ""
if (wanted) {
  file = files.find((f) => f.startsWith(wanted)) ?? ""
  if (!file) {
    console.error(`Сессии «${wanted}» нет в ${dir}`)
    process.exit(1)
  }
} else {
  file = files.map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs })).sort((a, b) => b.t - a.t)[0]?.f ?? ""
  if (!file) {
    console.error(`В ${dir} нет ни одной сессии`)
    process.exit(1)
  }
}

const events = readFileSync(join(dir, file), "utf8").split(/\r?\n/).filter(Boolean)
  .map((l) => { try { return JSON.parse(l) } catch { return null } })
  .filter(Boolean)

const skills = new Set()
const calls = [] // { id, name, cmd, at, result?, failed?, code? }
const byId = new Map()
const said = [] // { who, text, at }
const times = events.map((e) => e.timestamp).filter(Boolean).sort()

const full = (input) => String(input?.command ?? input?.file_path ?? input?.skill ?? JSON.stringify(input ?? {})).replace(/\s+/g, " ").trim()
// Голова и хвост: в длинной команде суть часто в конце (адрес, к которому она шла).
const describe = (input) => { const t = full(input); return t.length > 200 ? `${t.slice(0, 70)} … ${t.slice(-120)}` : t }

for (const e of events) {
  const content = e.message?.content
  if (e.type === "assistant" && Array.isArray(content)) {
    for (const c of content) {
      if (c.type !== "tool_use") continue
      if (c.name === "Skill" && c.input?.skill) skills.add(c.input.skill)
      const call = { id: c.id, name: c.name, cmd: describe(c.input), key: full(c.input), at: e.timestamp }
      calls.push(call)
      byId.set(c.id, call)
    }
  }
  if (e.type !== "user") continue
  if (typeof content === "string") {
    const ch = /^<channel [^>]*user="([^"]*)"[^>]*>\s*([\s\S]*?)(<\/channel>)?\s*$/.exec(content.trim())
    if (ch) said.push({ who: `Telegram (${ch[1]})`, text: cut(ch[2]), at: e.timestamp })
    else if (/^<pasted_content/.test(content.trim())) said.push({ who: "вставлено задачей", text: cut(content.replace(/<\/?pasted_content[^>]*>/g, "")), at: e.timestamp })
    else if (!/^<(command-|local-command|system-reminder)/.test(content.trim())) said.push({ who: "человек в терминале", text: cut(content), at: e.timestamp })
    continue
  }
  if (!Array.isArray(content)) continue
  for (const c of content) {
    if (c.type === "tool_result") {
      const call = byId.get(c.tool_use_id)
      if (!call) continue
      const text = typeof c.content === "string" ? c.content : JSON.stringify(c.content ?? "")
      const code = /^Exit code (\d+)/.exec(text)
      call.failed = c.is_error === true || Boolean(code && code[1] !== "0")
      call.code = code ? code[1] : c.is_error ? "error" : "0"
      call.result = cut(text.replace(/^Exit code \d+\s*/, ""), 160)
    } else if (c.type === "text" && !/^Base directory for this skill:/.test(c.text ?? "")) {
      said.push({ who: "человек в терминале", text: cut(c.text), at: e.timestamp })
    }
  }
}

const minutes = times.length > 1 ? Math.round((Date.parse(times.at(-1)) - Date.parse(times[0])) / 60000) : 0
console.log(`Сессия ${file.replace(/\.jsonl$/, "")} · ${times[0] ?? "?"} → ${times.at(-1) ?? "?"} (${minutes} мин) · вызовов инструментов: ${calls.length}`)
console.log(`Навыки: ${skills.size ? [...skills].join(", ") : "не загружались"}`)

const signals = []
calls.forEach((c, i) => {
  if (!c.failed) return
  const next = calls[i + 1]
  const after = next ? `дальше: ${next.name} ${next.cmd} → ${next.failed ? `тоже отказ (код ${next.code})` : "успех"}` : "дальше ничего"
  // Адреса, к которым шла упавшая команда, — отдельной строкой: в выжимке команды они часто срезаны.
  const urls = [...new Set(c.key.match(/https?:\/\/[^\s"']+/g) ?? [])]
  const where = urls.length ? `\n     адреса: ${urls.join(" ")}` : ""
  signals.push(`${c.name} отказ (код ${c.code}): ${c.cmd}${where}\n     ответ: ${c.result || "—"}\n     ${after}`)
})
const seen = new Map()
for (const c of calls) { const k = `${c.name}:${c.key}`; const v = seen.get(k) ?? { n: 0, c }; v.n++; seen.set(k, v) }
for (const { n, c } of seen.values()) if (n > 1) signals.push(`повтор ×${n}: ${c.name} ${c.cmd}`)

console.log("")
if (!signals.length) console.log("Сигналов нет: ни одна команда не упала и не повторялась.")
else {
  console.log(`Сигналы (${signals.length}):`)
  signals.forEach((s, i) => console.log(`  ${i + 1}. ${s}`))
}
console.log("")
console.log(said.length ? "Что сказано агенту:" : "Человек в этой сессии ничего не писал.")
for (const s of said) console.log(`  [${s.who}] ${s.text}`)
