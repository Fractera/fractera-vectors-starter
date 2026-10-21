// Guard of the DEVELOPMENT DOCUMENTS (node step 412-1). Run: npm run check:dev-docs (also in prebuild).
//
// Two rules, both from the person (2026-10-06):
// 1. Every entry of `development-docs/` is named in its README — a document nobody lists is never opened.
//    Folders count as one entry (`steps-new/`); dot files (`.gitkeep`) are ignored.
// 2. English only: «категорически требовать записи всех документов только на английском языке». Search here is literal,
//    and one Russian word has six case forms. Cyrillic is allowed only inside quotes «…», "…", “…” — the person's own words.
//    Checked in `development-docs/**/*.md`, in `CLAUDE.md` and in `.claude/modes/*.md` (node step 552-5).
//
// What it does not see: a Latin-script text in another language, and quoted Russian used instead of an English sentence.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DOCS = path.join(ROOT, "development-docs");
const problems = [];

if (!fs.existsSync(DOCS)) {
  console.error("check:dev-docs — development-docs/ is missing");
  process.exit(1);
}

// Rule 1: every entry is listed in README.md.
const readme = fs.existsSync(path.join(DOCS, "README.md")) ? fs.readFileSync(path.join(DOCS, "README.md"), "utf8") : null;
if (readme === null) problems.push("development-docs/README.md is missing");
else {
  for (const entry of fs.readdirSync(DOCS, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "README.md") continue;
    const name = entry.isDirectory() ? `${entry.name}/` : entry.name;
    if (!readme.includes("`" + name + "`")) problems.push(`development-docs/${name} is not listed in development-docs/README.md`);
  }
}

// Rule 3 (step 435-5, the person 2026-10-08: «Глоссари это неотъемлемая часть архитектуры документов которые должна существовать
// в каждом элементе»): every document of the set exists from birth. Without this rule a document vanished silently — the menu of
// the core shows only existing files, and the glossary, backlog and cancelled list were gone for days with every check green.
const REQUIRED = [
  "current-step.md", "steps-new/", "steps-done/", "pre-steps/", "glossary.md", "anti-patterns.md", "backlog.md", "cancelled.md",
  "reports/", "proofs/", "owner-decisions-on-skill-changes.md", "translation-debt.md",
];
for (const name of REQUIRED) {
  if (!fs.existsSync(path.join(DOCS, name))) problems.push(`development-docs/${name} is required and missing (README, «Every document below exists from the element's birth»)`);
}

// Rule 2: no Cyrillic outside quotes.
const CYRILLIC = /[Ѐ-ӿ]/;
const QUOTED = /«[^»]*»|"[^"]*"|“[^”]*”/g;
const files = [path.join(ROOT, "CLAUDE.md"), path.join(ROOT, ".claude", "modes", "build.md")];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".md")) files.push(p);
  }
};
walk(DOCS);
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
    if (CYRILLIC.test(line.replace(QUOTED, ""))) {
      problems.push(`${path.relative(ROOT, file).replaceAll("\\", "/")}:${i + 1} — Cyrillic outside quotes: ${line.trim().slice(0, 80)}`);
    }
  });
}

if (problems.length) {
  console.error(`check:dev-docs — ${problems.length} problem(s):`);
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log(`check:dev-docs — ok (${files.length} files, README lists every entry)`);
