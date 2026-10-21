#!/usr/bin/env node
// check:shadcn-rules — правила чужого навыка `shadcn`, проверенные машиной.
//
// 🔒 ОТКУДА ВЗЯТЫ ПРАВИЛА. Не из головы: из `.claude/skills/shadcn/rules/*.md`,
// вендорного навыка shadcn/ui (шаг 63-1). Здесь живут только те, что можно
// проверить механически; остальные — суждение, и место им в `use-shadcn`, а не
// в стороже. Правило, которое сторож не умеет проверить честно, он не проверяет
// вовсе: ложное срабатывание стоит дороже пропуска.
//
// 🔒 ГДЕ СМОТРИТ. Слой секций (`sections/`) и наши компоненты (`components/`),
// КРОМЕ `components/ui/` — это сам shadcn, чужой исходник, и мерить его его же
// правилами бессмысленно: он их автор.
//
// 🔒 ЧТО ДЕЛАЕТ С НАХОДКАМИ. Печатает таблицу «файл → правило» и падает. Каждое
// исключение названо поимённо с причиной — сторож, кричащий на законный код,
// отключают целиком в тот же день, и тогда он не ловит уже ничего.

import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
// 314-2: `sections/` удалён из шаблона — блоки «Блоков» лежат в `components/blocks/`.
// 425 (владелец 2026-10-07: «ни при каких обстоятельствах для виджетов, инструментов или блоков не использовать самописный
// инструмент»): виджеты живут в `app/**/_widgets/`, инструменты — в `_tools/`; оба теперь под сторожем.
const AREAS = ["components", "_tools", "app"]
const SKIP_DIRS = new Set(["ui", "node_modules"])

const RULES = [
  {
    id: "no-raw-control",
    why: "элемент управления и таблица — только из components/ui (Button, Input, Select, Textarea, Table, Label, AppDialog); нет нужного — npx shadcn@latest add <component>. Сырой тег не перекрашивается токенами, теряет клавиатуру и читалку экрана, не получает адрес подсветки",
    test: /<(button|input|select|textarea|table|dialog|label)(?=[\s>/]|$)/,
  },
  {
    id: "gap-not-space",
    why: "space-x-*/space-y-* заменяются на flex + gap-*. Исключение внутри правила: space-[xy]-0 — это СБРОС чужого отступа, а не расстановка своего",
    test: /className=["'{][^"'}]*\bspace-[xy]-(?!0\b)[\d.]/,
  },
  {
    id: "size-shorthand",
    why: "равные ширина и высота пишутся одним size-*",
    test: /\bw-(\d+)\s+h-\1\b/,
  },
  {
    id: "truncate-shorthand",
    why: "overflow-hidden text-ellipsis whitespace-nowrap = truncate",
    test: /overflow-hidden[^"'}]*text-ellipsis[^"'}]*whitespace-nowrap/,
  },
  {
    id: "no-literal-colour",
    why: "цвет берётся токеном; литеральная палитра Tailwind выводит вещь из системы дизайна",
    test: /className=["'{][^"'}]*\b(?:bg|text|border|ring|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/,
  },
  {
    id: "no-manual-dark",
    why: "ручные dark:-подмены цвета не нужны — токен уже знает обе темы",
    test: /\bdark:(?:bg|text|border)-(?!\[)[a-z]/,
  },
  {
    id: "separator-not-hr",
    why: "черта — это Separator, а не <hr> и не div с border-t",
    test: /<hr[\s/>]/,
  },
  {
    id: "skeleton-not-pulse",
    why: "заглушка загрузки — примитив Skeleton, а не свой animate-pulse",
    test: /animate-pulse/,
  },
  {
    id: "partial-class-in-template",
    why: "ЧАСТЬ имени класса, собранная из переменной, не попадает в сборку Tailwind — имена ищутся ТЕКСТОМ (оплачено шагом 54). Целый класс, вставленный через ${…}, безопасен: сторож ловит только разорванное имя",
    test: /className=\{`[^`]*[a-z0-9]-\$\{/,
  },
]

// 🔒 ИСКЛЮЧЕНИЯ — поимённо, с причиной.
const EXEMPT = [
  {
    file: "app/global-error.tsx",
    rule: "no-raw-control",
    why: "заменяет корневой макет целиком: глобальный CSS и компоненты там не гарантированы, вся разметка на инлайн-стилях",
  },
  {
    file: "components/ui/",
    rule: "*",
    why: "исходник shadcn: чужой код, автор этих же правил",
  },
  {
    file: "components/ai-elements/",
    rule: "*",
    why: "AI Elements (Vercel, реестр @ai-elements, шаг 333-12): чужой исходник shadcn-формата, ставится `shadcn add`; наши правки в нём — только облегчение (без streamdown и shiki) и цвет текста",
  },
  {
    file: "lib/blocks/tone.ts",
    rule: "no-literal-colour",
    why: "карта тонов блока «Блоков» ПЕРЕЧИСЛЯЕТ классы намеренно — именно так класс попадает в сборку Tailwind (урок шага 54)",
  },
]

// 🛑 ДОЛГ, А НЕ ИСКЛЮЧЕНИЕ: правило нарушено по существу, и починка меняет
// внешность — значит это решение владельца, а не работа сторожа.
const KNOWN_DEBT = [
  // Пусто — и механизм оставлен намеренно: следующий сторож, приходящий в живой
  // дом, начнёт с того же. Долг «статусные цвета голосового поля» закрыт шагом
  // 64: цвета стали ролями палитры (warning, recording), а не литералами.
]

const files = []
for (const area of AREAS) {
  const dir = path.join(ROOT, area)
  if (!fs.existsSync(dir)) continue
  ;(function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue
        walk(path.join(d, e.name))
      } else if (/\.(tsx|ts)$/.test(e.name)) files.push(path.join(d, e.name))
    }
  })(dir)
}

const rel = p => p.split(path.sep).join("/").replace(ROOT.split(path.sep).join("/") + "/", "")

// 🔒 РАЗБОР ПОСТРОЧНЫЙ, А НЕ ПО ВСЕМУ ФАЙЛУ, И ЭТО НЕ УДОБСТВО.
// Правило перестаёт быть честным ровно там, где контекст меняет ответ: вертикальный
// ритм СПИСКА держит `space-y-*`, потому что `flex` на `<ul>` уносит маркеры у `<li>`.
// По целому файлу такую строку не отличить от нарушения; по строке — видно.
const findings = []
const debts = []
for (const f of files.sort()) {
  const r = rel(f)
  const lines = fs.readFileSync(f, "utf8").split("\n")
  // 425: строки внутри блочного комментария — объяснение, а не разметка (правило no-raw-control их не считает).
  const inComment = []
  let open = false
  for (const line of lines) {
    const starts = line.includes("/*"), ends = line.includes("*/")
    inComment.push(open || (starts && !line.trimStart().startsWith("<")))
    if (starts && !ends) open = true
    if (ends) open = false
  }
  for (const rule of RULES) {
    const skip = EXEMPT.find(e => r.includes(e.file) && (e.rule === "*" || e.rule === rule.id))
    if (skip) continue
    lines.forEach((line, i) => {
      if (!rule.test.test(line)) return
      if (rule.id === "no-raw-control" && (inComment[i] || /^\s*(\/\/|\*|\/\*)/.test(line))) return
      if (rule.id === "gap-not-space" && /<(ul|ol)\b/.test(line)) return
      const debt = KNOWN_DEBT.find(d => d.file === r && d.rules.includes(rule.id))
      if (debt) {
        if (!debts.includes(debt)) debts.push(debt)
        return
      }
      findings.push({ file: r, line: i + 1, rule: rule.id, why: rule.why })
    })
  }
}

const kinds = files.filter(f => /sections[\\/]blocks[\\/].*\.server\.tsx$/.test(f)).length
console.log(`\n  просмотрено файлов: ${files.length} (рендерреров видов среди них: ${kinds})`)
for (const e of EXEMPT) console.log(`  · исключение ${e.file} [${e.rule}]: ${e.why}`)

if (debts.length) {
  console.log("\n  🛑 ДОЛГ, НАЗВАННЫЙ ВСЛУХ (не исключение — починка меняет внешность, ждёт владельца):")
  for (const d of debts) console.log(`  · ${d.file}\n      с ${d.since}: ${d.why}`)
}

if (findings.length) {
  console.error("\n===SHADCN_RULES_FAILED===")
  const byRule = new Map()
  for (const f of findings) byRule.set(f.rule, [...(byRule.get(f.rule) || []), f])
  for (const [rule, list] of byRule) {
    console.error(`\n  ✗ ${rule} — ${list[0].why}`)
    for (const f of list) console.error(`      ${f.file}:${f.line}`)
  }
  console.error(`\n  ${findings.length} находок. Правила — .claude/skills/shadcn/rules/, когда они действуют — use-shadcn.\n`)
  process.exit(1)
}

console.log("\n===SHADCN_RULES_OK===\n")
