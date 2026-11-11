// Every script of this template must parse — `node --check` on each file in scripts/ (federal step 618).
// ✗ 2026-10-21 (template v0.1.16): an apostrophe inside a single-quoted string in scripts/passport.mjs broke `npm run passport` in every
// element for nine days, and no prebuild guard saw it — nothing imports that script, it only runs when an agent calls it.
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const bad = []
let n = 0
for (const f of readdirSync('scripts').sort()) {
  if (!/\.(mjs|cjs|js)$/.test(f)) continue
  n++
  const r = spawnSync(process.execPath, ['--check', join('scripts', f)], { encoding: 'utf8', windowsHide: true })
  if (r.status !== 0) bad.push(`${f}: ${String(r.stderr).split('\n').filter(Boolean).slice(0, 3).join(' | ')}`)
}
if (bad.length) {
  console.error(`===SCRIPTS_SYNTAX_FAIL=== ${bad.length} of ${n}\n${bad.join('\n')}`)
  process.exit(1)
}
console.log(`===SCRIPTS_SYNTAX_OK=== ${n} scripts parse`)
