// WHERE THIS ELEMENT'S DEVELOPMENT STANDS — the passport fragment `development` (core step 686-3).
//   npm run development                                            — print the fragment
//   npm run development -- --steps "21,22.1,22.2,24" --current 22.1 --state planning [--next "<one line>"]
//   npm run development -- --none                                  — no active step
//
// The owner of the node, 2026-11-08: «в базовом файле own-service-props.json появляется фрагмент: – текущий шаги разработки 21, 22.1,
// 22.2, 24. – Текущий шаг 22.1, состояние: планирование». You write it at every event you write `development-docs/current-step.md` on
// (skill `use-development-docs`); the core's main agent reads it by code, without waking you (`npm run where` in the core), and asks you
// only when it disagrees with how your last turn ended (skill `answer-the-leader`).
// The pen is code: every other key of the passport and its format stay as they were; a bad value writes nothing (exit 1). Never edit the
// fragment by hand — a broken passport breaks this element's door.
import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const FILE = join(process.cwd(), 'OWN-SERVICE-PROPS', 'OWN-SERVICE-PROPS.json')
const STATES = ['planning', 'building', 'checking', 'waiting', 'done', 'stopped']
const args = process.argv.slice(2)
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] ?? '' : null }
const fail = (msg) => { console.log(`===DEVELOPMENT_FAIL=== ${msg}`); process.exit(1) }

let text
let passport
try {
  text = readFileSync(FILE, 'utf8')
  passport = JSON.parse(text.replace(/^﻿/, ''))
} catch {
  fail(`no readable passport at ${FILE}`)
}

if (!args.length) {
  console.log(passport.development ? JSON.stringify(passport.development, null, 2) : 'no fragment `development` yet — write it at your next step event')
  process.exit(0)
}

const STEP = /^[0-9]+(?:[.-][0-9]+)*$/
let fragment
if (args.includes('--none')) {
  fragment = { steps: [], current: null, state: 'done', at: new Date().toISOString() }
} else {
  const steps = String(flag('--steps') ?? '').split(/[,\s]+/).filter(Boolean)
  const current = String(flag('--current') ?? '').trim()
  const state = String(flag('--state') ?? '').trim()
  const next = flag('--next')
  if (!steps.length || steps.some((s) => !STEP.test(s))) fail('--steps: numbers like "21,22.1,22.2,24"')
  if (!STEP.test(current)) fail('--current: one step number, like 22.1')
  if (!steps.includes(current)) steps.push(current)
  if (!STATES.includes(state)) fail(`--state: one of ${STATES.join(' · ')}`)
  fragment = { steps, current, state, ...(next ? { next: next.replace(/\s+/g, ' ').trim().slice(0, 200) } : {}), at: new Date().toISOString() }
}

passport.development = fragment
const out = JSON.stringify(passport, null, 2) + (text.endsWith('\n') ? '\n' : '')
writeFileSync(FILE + '.tmp', out)
renameSync(FILE + '.tmp', FILE)
console.log(`===DEVELOPMENT_OK=== ${fragment.current ? `step ${fragment.current}, ${fragment.state}` : 'no active step'}`)
