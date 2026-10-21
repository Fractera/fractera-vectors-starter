// ОТДАТЬ ОПИСАНИЕ ЭЛЕМЕНТА В ЯДРО УЗЛА (узел, шаг 329). `npm run describe:publish`.
//
// Слово владельца 2026-09-28: «у тебя есть собственное описание и есть ещё общий файл в ядре, который также должен быть
// обновлён … вся эта процедура должна проходить через Claude Code». Агент элемента пишет описание в свой паспорт
// (паспорт `OWN-SERVICE-PROPS/`: `shortDescription`; навыки визитки `OWN-SERVICE-PROPS/A2A-CARD.json`), коммитит и зовёт эту команду — ядро проверяет паспорт и переносит описание
// в общий реестр узла. Ядро делает это той же дверью, что и кнопка «Забрать в ядро» (325-2): форма проверяется там, а не здесь.
//
// 🔒 ЯДРО ЗОВЁТСЯ ПО ПЕТЛЕ МАШИНЫ, И ЕГО ПОРТ СПРАШИВАЕТСЯ У УЗЛА, А НЕ ПОМНИТСЯ: `NODE_DOMAIN_FILE` (его пишет установщик)
// указывает на `<узел>/logs/domain.json`, рядом лежит `logs/runtime.json` с портом ядра. Публичный адрес ядра не годится:
// через интернет дверь потребует вход, а с машины хозяин — архитектор.

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"

const root = process.cwd()

function envFile() {
  const out = {}
  try {
    for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) out[m[1]] = m[2].trim()
    }
  } catch { /* нет файла — только окружение процесса */ }
  return out
}

const env = { ...envFile(), ...process.env }

function ownId() {
  try {
    const id = JSON.parse(readFileSync(join(root, "OWN-SERVICE-PROPS", "OWN-SERVICE-PROPS.json"), "utf8")).id
    if (typeof id === "string" && id) return id
  } catch { /* паспорта нет */ }
  return env.ITEM_ID?.trim() || null
}

function coreUrl() {
  const domainFile = env.NODE_DOMAIN_FILE?.trim()
  if (domainFile) {
    try {
      // Хост — тот, что слушает ядро (`runtime.json` → hostname): у ядра `localhost` бывает IPv6, и 127.0.0.1 не отвечает.
      const rt = JSON.parse(readFileSync(join(dirname(dirname(domainFile)), "logs", "runtime.json"), "utf8"))
      if (Number.isInteger(rt.port)) return `http://${typeof rt.hostname === "string" && rt.hostname ? rt.hostname : "localhost"}:${rt.port}`
    } catch { /* узел не сказал порт */ }
  }
  const a = env.ARCHITECT_URL?.trim()
  return a && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(a) ? a.replace(/\/+$/, "") : null
}

const WORDS = {
  "summary-not-written": "shortDescription in OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json is empty or still the template/birth text — write what this element does (skill passport-description)",
  "provides-bad-shape": "provides must be 1–20 different names of latin letters, digits and dashes (for example price-list)",
  "not-a-born-element": "the node does not know this element as a born one",
  "registry-failed": "the node could not write its registry",
  "temporary-address": "the core refused a request through its temporary public address",
}

const id = ownId()
const core = coreUrl()
if (!id) { console.error("DESCRIBE_FAILED: this element has no id (OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json → id)"); process.exit(1) }
if (!core) { console.error("DESCRIBE_FAILED: the node core address is unknown here (NODE_DOMAIN_FILE → logs/runtime.json)"); process.exit(1) }

try {
  const r = await fetch(`${core}/api/architect/items/${encodeURIComponent(id)}/describe`, { method: "POST", signal: AbortSignal.timeout(20000) })
  const j = await r.json().catch(() => ({}))
  if (r.ok && j.ok) {
    console.log(`DESCRIBE_OK: the core took the description of «${id}» into the node registry.`)
    process.exit(0)
  }
  console.error(`DESCRIBE_FAILED (${r.status}): ${WORDS[j.error] ?? j.error ?? "no answer"}`)
  process.exit(1)
} catch (e) {
  console.error(`DESCRIBE_FAILED: the core did not answer at ${core} — ${e instanceof Error ? e.message : e}`)
  process.exit(1)
}
