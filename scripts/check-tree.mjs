// СТОРОЖ СТАРТОВОГО ДЕРЕВА (шаг узла 462). Сверяет элемент со снимком стартового дерева шаблона
// (`.claude/skills/build-skills/skills/use-element-tree/tree-manifest.json`) и при каждой сборке печатает, чего не хватает.
//
// Владелец 2026-10-12: «да, делай раздел восстановления и сторожа». Сторож НЕ запрещает удалять — он делает удаление видимым.
// Три вердикта (закон сторожа в живом проекте): есть · ИСКЛЮЧЕНИЕ — путь записан в `development-docs/tree-exceptions.json` со словами
// владельца, почему его нет · ДОЛГ — пути нет и причины нет: печатается при каждой сборке, пока его не вернут или не объяснят.
// Сборку сторож не роняет (код 0): удалить страницу по слову человека — законно; молча — видно.
// Вернуть — навык `use-element-tree`, раздел «Restore the starting architecture».
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => { try { return JSON.parse(readFileSync(join(ROOT, p), 'utf8')) } catch { return null } }
const m = read('.claude/skills/build-skills/skills/use-element-tree/tree-manifest.json')
if (!m) { console.log('===TREE_NO_MANIFEST=== .claude/skills/build-skills/skills/use-element-tree/tree-manifest.json is missing — nothing to compare with'); process.exit(0) }
const exceptions = read('development-docs/tree-exceptions.json')?.paths ?? {}
const all = [...m.rootFiles, ...m.dirs, ...m.files]
const covered = (p) => Object.keys(exceptions).find((e) => p === e || p.startsWith(e + '/'))
const debts = []
const excused = []
for (const p of all) {
  if (existsSync(join(ROOT, p))) continue
  const e = covered(p)
  if (e) excused.push([p, e])
  else debts.push(p)
}
const byException = [...new Set(excused.map(([, e]) => e))]
for (const e of byException) console.log(`  исключение ${e} — ${exceptions[e]}`)
// Долги сворачиваются до верхней отсутствующей папки: удалённая страница — одна строка, а не пять файлов.
const top = debts.filter((p) => !debts.some((q) => q !== p && p.startsWith(q + '/')))
const roots = [...new Set(top.map((p) => { const parts = p.split('/'); for (let i = 1; i <= parts.length; i++) { const d = parts.slice(0, i).join('/'); if (!existsSync(join(ROOT, d))) return d } return p }))]
for (const d of roots) console.log(`  нет ${d} — есть в стартовом дереве ${m.template} ${m.after}; вернуть: навык use-element-tree, «Restore the starting architecture»`)
if (roots.length) console.log(`===TREE_DEBT=== отсутствует путей стартового дерева: ${roots.length} (исключений: ${byException.length})`)
else console.log(`===TREE_OK=== стартовое дерево ${m.template} ${m.after} на месте: ${all.length} путей, исключений: ${byException.length}`)
