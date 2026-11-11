// npm run eyes -- <address> [--click "<text or css>"]… [--measure "<css>"]… [--top] [--width 390] [--dark] [--full] — the eyes of this
// element's agent (node step 648): a browser with no window opens a page, clicks, takes a screenshot and tells what lies on top of what.
//
// The node keeps ONE browser for all its elements, like REA and the study browser (`npm run study`): this command only calls the core's
// `scripts/eyes.mjs` and asks it to put the screenshot into THIS element's `logs/eyes/` (outside git) — open the PNG and look at it.
// The owner, 2026-11-04: «Давай добавим возможность play Wing для рут и стартового кастомного шаблона» — after an interface was shown to
// him broken because it was proven by its classes in the build, not seen. How to use it — skill `use-eyes`.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const NODE = resolve(ROOT, '..', '..', '..') // an element lives at <node>/WEB4-ITEMS/<kind>/<id>
const file = join(NODE, 'scripts', 'eyes.mjs')
const args = process.argv.slice(2)

if (!existsSync(file)) {
  console.log('===EYES_FAILED=== the core of this node has no scripts/eyes.mjs (an older core: update the node)')
  process.exit(3)
}
if (!args.includes('--out')) {
  const dir = join(ROOT, 'logs', 'eyes')
  mkdirSync(dir, { recursive: true })
  args.push('--out', join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}.png`))
}
const env = {}
for (const [k, v] of Object.entries(process.env)) if (v !== undefined && !/^(__NEXT|NEXT_|AGI_)/.test(k)) env[k] = v
const r = spawnSync(process.execPath, [file, ...args], { cwd: NODE, env, stdio: 'inherit', windowsHide: true })
process.exit(r.status ?? 1)
