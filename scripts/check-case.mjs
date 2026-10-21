// Машинная приёмка РЕГИСТРА В ПУТЯХ ИМПОРТА (владелец 2026-09-20).
// Запуск: npm run check:case
//
// 🔒 ЧТО ЭТО ЛОВИТ — И ГРАНИЦА ИЗМЕРЕНА, А НЕ ПРЕДПОЛОЖЕНА (шаг 258).
// Импорт `@/lib/Showcase` при живом `lib/showcase.ts` работает на Windows и
// macOS, где файловая система регистр не различает, и падает на Linux, где
// различает. Продукт ставится на домашние машины всех трёх родов.
//
// 🛑 НО ДЛЯ .ts/.tsx ЭТО УЖЕ ЛОВИТ TYPESCRIPT, И ЭТО ПРОВЕРЕНО ПОРЧЕЙ: он держит
// список файлов проекта с настоящим регистром и на чужой регистр в импорте даёт
// TS1261/TS1149 — на Windows тоже. Измерено дважды: при одном неверном импортёре
// и при всех трёх сразу. Значит сторож здесь лишь быстрее и понятнее, не более.
//
// 🔒 ЦЕННОСТЬ СТОРОЖА — В СЛЕПОЙ ЗОНЕ TSC, И ОНА БОЛЬШАЯ: `tsconfig.json` включает
// **/*.ts, **/*.tsx и **/*.mts — и НЕ включает .mjs/.cjs. Таких файлов у нас 49, и
// это самое важное, что есть: установщик, все сторожа, микрослужбы — то, что
// выполняется на машине человека. Там регистр не проверяет НИКТО, отказ приходит
// не сборкой, а в рантайме у пользователя. Проверено порчей: испорченный импорт в
// scripts/build-api-map.mjs дал у tsc ноль жалоб, у этого сторожа — ошибку.
// 🔒 ПОЧЕМУ КАНОН БЕРЁТСЯ ИЗ ИНДЕКСА GIT, А НЕ С ДИСКА. Спросить файловую
// систему Windows «есть ли Showcase.ts» бессмысленно — она ответит «есть» и для
// showcase.ts. Единственный источник, помнящий записанный регистр, — индекс git
// (`git ls-files`). Он же и есть то, что получит клиент при клонировании.
//
// 🛑 ЛОВУШКА ПРИ ПОЧИНКЕ, ОПЛАЧЕННАЯ ИЗМЕРЕНИЕМ: в этом репозитории
// `git config core.ignorecase` = true. Переименование файла по регистру git НЕ
// ЗАМЕТИТ и в коммит не положит — правка будет выглядеть сделанной, а на Linux
// сломается ровно так же. Чинить надо либо правкой ИМПОРТА (обычный случай),
// либо переименованием файла в два хода:
//     git mv Foo.ts tmp-foo.ts && git mv tmp-foo.ts foo.ts
//
// ЧЕГО СТОРОЖ НЕ ВИДИТ И ЭТО НЕ ДЕФЕКТ: динамические пути через шаблонную
// строку, генерируемые файлы (их нет в индексе до сборки) и вендорный чужой
// код в `.claude/skills/` — он ссылается на компоненты, которых у нас нет.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const errors = [];

// ── Канон имён: индекс git ───────────────────────────────────────────────────
let tracked = [];
try {
  tracked = execFileSync("git", ["-C", ROOT, "ls-files"], { encoding: "utf8", maxBuffer: 64e6 })
    .split("\n").map((s) => s.trim()).filter(Boolean);
} catch {
  console.log("  ОШИБКА: git недоступен — канонический регистр имён взять неоткуда");
  console.log("\n===CASE_FAILED=== ошибок: 1");
  process.exit(1);
}
if (!tracked.length) {
  console.log("  ОШИБКА: индекс git пуст — проверять нечего");
  console.log("\n===CASE_FAILED=== ошибок: 1");
  process.exit(1);
}

const exact = new Set(tracked);
const lower = new Map();
for (const f of tracked) {
  const k = f.toLowerCase();
  if (!lower.has(k)) lower.set(k, f);
}

// Те же расширения, по которым ищет сборщик.
const EXT = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css",
             "/index.ts", "/index.tsx", "/index.js", "/index.jsx", "/index.mjs", "/index.cjs"];

// Сначала побайтно, потом без учёта регистра. Разрешилось ТОЛЬКО вторым
// способом — здесь работает, на Linux сломается.
function resolve(target) {
  for (const e of EXT) {
    const cand = path.posix.normalize(target + e);
    if (exact.has(cand)) return { hit: "exact" };
  }
  for (const e of EXT) {
    const cand = path.posix.normalize(target + e);
    const canon = lower.get(cand.toLowerCase());
    if (canon) return { hit: "case", asked: cand, canon };
  }
  return { hit: "none" };
}

const SOURCES = tracked.filter(
  (f) => /\.(ts|tsx|mjs|cjs|js|jsx)$/.test(f) && !f.startsWith(".claude/"),
);

const SPEC =
  /(?:import|export)[\s\S]{0,200}?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|require\s*\(\s*["']([^"']+)["']\s*\)/g;

let checked = 0;
for (const rel of SOURCES) {
  let text;
  try { text = fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch { continue; }
  const dir = path.posix.dirname(rel);
  SPEC.lastIndex = 0;
  let m;
  while ((m = SPEC.exec(text))) {
    const spec = m[1] || m[2] || m[3];
    if (!spec || spec.includes("${")) continue;      // шаблонная строка — не наш случай
    let target;
    if (spec.startsWith("./") || spec.startsWith("../")) target = path.posix.normalize(path.posix.join(dir, spec));
    else if (spec.startsWith("@/")) target = spec.slice(2);
    else continue;                                    // пакет из node_modules
    checked++;
    const r = resolve(target);
    if (r.hit !== "case") continue;
    const line = text.slice(0, m.index).split("\n").length;
    errors.push(`${rel}:${line}: импорт "${spec}" — просили ${r.asked}, в git лежит ${r.canon}; на Linux это «module not found»`);
  }
}

console.log(`проверено импортов на свои файлы: ${checked} в ${SOURCES.length} файлах`);
for (const e of errors) console.log(`  ОШИБКА: ${e}`);

if (errors.length) {
  console.log("\n  Чинить правкой ИМПОРТА. Если переименовывать файл — только в два хода:");
  console.log("  git mv Foo.ts tmp-foo.ts && git mv tmp-foo.ts foo.ts   (core.ignorecase=true съест один ход)");
  console.log(`\n===CASE_FAILED=== ошибок: ${errors.length}`);
  process.exit(1);
}
console.log("\n===CASE_OK=== ошибок нет");
