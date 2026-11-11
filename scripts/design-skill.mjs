// npm run design-skill — the design skill this element builds its pages in (node step 590-6; 716).
//
// The element's own: the passport field `designSkill` — the skill of the approved design (`npm run design:pin` writes it in an element
// with design prototypes; the person's choice otherwise). Empty — no skill chosen yet: the element's own `DESIGN-CONFIG` and `DESIGN.md`
// hold the look. Nothing else is asked: the node has no shared design (716, the owner 2026-11-10).
// Prints one line: `===DESIGN_SKILL=== <skill> (<where from>)`; `none` — no skill chosen yet.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from './core-door.mjs'

// A JSON written by a Windows editor may open with a byte-order mark — JSON.parse refuses it.
const read = (p) => { try { return JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, '')) } catch { return null } }
const own = read(join(ROOT, 'OWN-SERVICE-PROPS', 'OWN-SERVICE-PROPS.json'))?.designSkill?.trim?.() || null

console.log(own
  ? `===DESIGN_SKILL=== ${own} (this element's approved design skill — the passport's designSkill)`
  : '===DESIGN_SKILL=== none (no design skill chosen yet: work from DESIGN-CONFIG and DESIGN.md)')
