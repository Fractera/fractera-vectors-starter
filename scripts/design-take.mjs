// npm run design:take -- <development-docs/pre-steps/<…>.look-from-<id>.json> — take a sibling element's look (node step 717-5).
//
// The owner 2026-11-10: the working pages of a family of elements «выполнены с использованием одного и того же навыка». The core's main
// agent, on the person's word, puts the look the sibling took into the core into this element's intake (`npm run look -- <this> --like
// <sibling>` in the core): a request and this data file. This command applies it — a COPY, never a live link (no single point of
// failure: the sibling changing later changes nothing here):
//   OWN-SERVICE-PROPS.json  `design` ← the sibling's brief (`inheritedFrom` names it), `designSkill` ← its skill when it has one
//   DESIGN-CONFIG/design-config.json  each branch the sibling has (colors, fonts, type, shape, motion) replaces this element's branch;
//                                      a branch it lacks stays as it was — written as a patch, never the whole file
// The sibling's pictures never travel (each store opens only to its own element): its references keep their links and notes only.
// After it: `npm run eyes` on the pages, commit, the person approves; nothing is rebuilt — a saved token redraws the pages.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BRANCHES = ['colors', 'fonts', 'type', 'shape', 'motion']
const isObj = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
const fail = (m) => { console.error(`===DESIGN_TAKE_FAILED=== ${m}`); process.exit(1) }
const readJson = (f) => JSON.parse(readFileSync(f, 'utf8').replace(/^﻿/, ''))

const arg = process.argv[2]
if (!arg) fail('npm run design:take -- <development-docs/pre-steps/…look-from-<id>.json> — the file the core put into your intake')
const file = resolve(ROOT, arg)
if (!existsSync(file)) fail(`no file ${arg}`)
let look
try { look = readJson(file) } catch (e) { fail(`${arg} is not JSON: ${e.message}`) }
if (!isObj(look) || typeof look.from !== 'string' || !isObj(look.brief)) fail(`${arg} is not a look from the core (from, brief, tokens)`)
if (look.tokens !== null && look.tokens !== undefined && !isObj(look.tokens)) fail(`${arg}: tokens must be an object or null`)
const unknown = Object.keys(look.tokens ?? {}).filter((b) => !BRANCHES.includes(b))
if (unknown.length) fail(`${arg}: unknown token branches ${unknown.join(', ')} — only ${BRANCHES.join(', ')}`)

const propsFile = join(ROOT, 'OWN-SERVICE-PROPS', 'OWN-SERVICE-PROPS.json')
const props = readJson(propsFile)
const brief = { ...look.brief, inheritedFrom: look.from }
for (const r of Array.isArray(brief.references) ? brief.references : []) delete r.media
props.design = brief
if (typeof brief.skill === 'string' && brief.skill) props.designSkill = brief.skill
writeFileSync(propsFile, JSON.stringify(props, null, 2) + '\n', 'utf8')

const cfgFile = join(ROOT, 'DESIGN-CONFIG', 'design-config.json')
const cfg = existsSync(cfgFile) ? readJson(cfgFile) : {}
const taken = BRANCHES.filter((b) => isObj(look.tokens?.[b]))
for (const b of taken) cfg[b] = look.tokens[b]
if (taken.length) writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + '\n', 'utf8')

console.log(`===DESIGN_TAKEN=== from ${look.from}: brief ${Object.keys(look.brief).join(', ') || '—'}; tokens ${taken.join(', ') || '—'}${props.designSkill ? `; design skill ${props.designSkill}` : ''}`)
console.log('Next: npm run check:config-schemas, npm run eyes on the home page and a working page, commit, show the person; move the request to pre-steps/handled/.')
