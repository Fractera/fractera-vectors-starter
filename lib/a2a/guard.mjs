// OUTBOUND A2A GUARD (step 419-1). Everything this element sends to another agent — the agent's `reply`, the artifacts of the
// code skills, `npm run a2a -- send` — passes `checkOutbound` first. Plain functions: no AI model, no network (owner 2026-10-06:
// «only functions», «not need проверки AI Luna»). The Luhn check is arithmetic on the card's check digit, not a model: it tells a
// card number from any 16 digits in a row (an order number) and keeps false blocks down.
// The owner's policy is a file of the element — `OWN-SERVICE-PROPS/A2A-GUARD.json`; no file means the defaults below.
// 🔒 A verdict names its rules, never the matched text: the reason goes to the agent and to the log, the secret goes nowhere.
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** @typedef {'deny' | 'mask' | 'off'} Action */

export const DEFAULT_POLICY = Object.freeze({
  rules: Object.freeze({ card: 'deny', cvv: 'deny', secret: 'deny', phone: 'mask', email: 'mask', 'owner-words': 'deny' }),
  ownerWords: Object.freeze([]),
})

const ACTIONS = new Set(['deny', 'mask', 'off'])

/** The element's policy; a missing or broken file falls back to the defaults rule by rule (a typo never switches a rule off). */
export function loadPolicy(root = process.cwd()) {
  let raw = {}
  try { raw = JSON.parse(readFileSync(join(/*turbopackIgnore: true*/ root, 'OWN-SERVICE-PROPS', 'A2A-GUARD.json'), 'utf8')) } catch { raw = {} }
  const rules = { ...DEFAULT_POLICY.rules }
  for (const [name, action] of Object.entries(raw?.rules ?? {})) if (name in rules && ACTIONS.has(action)) rules[name] = action
  const ownerWords = Array.isArray(raw?.ownerWords) ? raw.ownerWords.filter((w) => typeof w === 'string' && w.trim()).map((w) => w.trim()) : []
  return { rules, ownerWords }
}

function luhn(digits) {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return sum % 10 === 0
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Each detector returns the [start, end) spans it found. */
const DETECTORS = {
  card(text) {
    const out = []
    for (const m of text.matchAll(/(?<![\d-])\d(?:[ -]?\d){12,18}(?![\d-])/g)) {
      const digits = m[0].replace(/\D/g, '')
      if (digits.length >= 13 && digits.length <= 19 && luhn(digits)) out.push([m.index, m.index + m[0].length])
    }
    return out
  },
  cvv(text, found) {
    const out = []
    for (const m of text.matchAll(/\b(?:cvv2?|cvc2?|csc|cid|security code|код безопасности)\b\W{0,5}(\d{3,4})(?!\d)/giu)) {
      const start = m.index + m[0].length - m[1].length
      out.push([start, start + m[1].length])
    }
    // A bare 3–4 digit group within 40 characters after a card number (not a part of an expiry date like 12/29) is its CVV.
    for (const [, end] of found.card ?? []) {
      const m = /^[\s\S]{1,40}?(?<![\d/])(\d{3,4})(?![\d/])/.exec(text.slice(end, end + 45))
      if (m) { const start = end + m[0].length - m[1].length; out.push([start, start + m[1].length]) }
    }
    return out
  },
  secret(text) {
    const out = []
    const patterns = [
      /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{16,}/g, // OpenAI, Anthropic
      /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}/g, // GitHub
      /\bxox[abprs]-[A-Za-z0-9-]{10,}/g, // Slack
      /\bAKIA[0-9A-Z]{16}\b/g, // AWS access key
      /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/g, // Telegram bot token
      /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
      /\b[A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD)[A-Z0-9_]*\s*[=:]\s*["']?[^\s"']{6,}/g, // NAME_KEY=value
      /(?<![A-Za-z0-9])[a-f0-9]{48,}(?![A-Za-z0-9])/gi, // long hex (48+: a 40-char git commit id passes, a 64-char key does not)
      /(?<![A-Za-z0-9+/=_-])(?=[A-Za-z0-9+/_-]*\d)(?=[A-Za-z0-9+/_-]*[a-z])(?=[A-Za-z0-9+/_-]*[A-Z])[A-Za-z0-9+/_-]{40,}={0,2}(?![A-Za-z0-9+/=_-])/g, // long base64 mixing cases and digits
    ]
    for (const re of patterns) for (const m of text.matchAll(re)) out.push([m.index, m.index + m[0].length])
    return out
  },
  phone(text) {
    const out = []
    for (const m of text.matchAll(/(?<![\w.-])\+?\d[\d ().-]{8,18}\d(?![\w-])/g)) {
      const digits = m[0].replace(/\D/g, '')
      if (digits.length < 10 || digits.length > 15) continue
      if (/^\d{4}-\d{2}-\d{2}/.test(m[0])) continue // a date, not a phone
      if (!/^\+/.test(m[0]) && !/[ ().-]/.test(m[0])) continue // a bare digit run is an id, not a phone
      out.push([m.index, m.index + m[0].length])
    }
    return out
  },
  email(text) {
    return [...text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)].map((m) => [m.index, m.index + m[0].length])
  },
  'owner-words'(text, _found, policy) {
    const out = []
    for (const w of policy.ownerWords) {
      for (const m of text.matchAll(new RegExp(`(?<![\\p{L}\\p{N}])${escape(w)}(?![\\p{L}\\p{N}])`, 'giu'))) out.push([m.index, m.index + m[0].length])
    }
    return out
  },
}

const ORDER = ['card', 'cvv', 'secret', 'phone', 'email', 'owner-words']

/**
 * Check one outbound text.
 * @returns {{ verdict: 'allow' | 'mask' | 'deny', rules: string[], text: string }}
 *   `rules` — every rule that fired; `text` — the text to send (masked when the verdict is `mask`, the original when `allow`,
 *   empty when `deny`: nothing of a denied text goes out).
 */
export function checkOutbound(input, policy = DEFAULT_POLICY) {
  const text = typeof input === 'string' ? input : JSON.stringify(input ?? '')
  const found = {}
  const fired = []
  for (const name of ORDER) {
    if (policy.rules[name] === 'off') continue
    const spans = DETECTORS[name](text, found, policy)
    if (spans.length) { found[name] = spans; fired.push(name) }
  }
  if (fired.some((r) => policy.rules[r] === 'deny')) return { verdict: 'deny', rules: fired, text: '' }
  if (!fired.length) return { verdict: 'allow', rules: [], text }
  const spans = fired.flatMap((r) => found[r]).sort((a, b) => a[0] - b[0])
  let out = ''
  let at = 0
  for (const [s, e] of spans) {
    if (e <= at) continue
    out += text.slice(at, Math.max(s, at)) + '[hidden]'
    at = e
  }
  return { verdict: 'mask', rules: fired, text: out + text.slice(at) }
}

/** Check a JSON value (a `--data` payload, an artifact): masking applies to every string inside, a deny anywhere denies all. */
export function checkOutboundData(value, policy = DEFAULT_POLICY) {
  const rules = new Set()
  let denied = false
  const walk = (v) => {
    if (typeof v === 'string') {
      const r = checkOutbound(v, policy)
      r.rules.forEach((x) => rules.add(x))
      if (r.verdict === 'deny') denied = true
      return r.text
    }
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
    return v
  }
  const data = walk(value)
  if (denied) return { verdict: 'deny', rules: [...rules], data: null }
  return { verdict: rules.size ? 'mask' : 'allow', rules: [...rules], data }
}

/** The reason in words for the agent that tried to send — names the rules, never the text. */
export function blockedReason(rules) {
  return `Blocked by the outbound A2A guard (rules: ${rules.join(', ')}). Nothing was sent. Answer without card numbers, CVV, keys, tokens or the owner's forbidden words.`
}

/**
 * One line per guard verdict other than `allow` into `<SERVICE_DATA_DIR>/a2a/guard-log.jsonl` — time, channel, verdict, rules,
 * task id or address; never the text. A log that cannot be written never stops the guard: the block itself already happened.
 * @param {string | undefined} dataDir
 * @param {{ channel: 'reply' | 'skill' | 'send', verdict: string, rules: string[], taskId?: string, to?: string }} rec
 */
export function logGuard(dataDir, rec) {
  if (!dataDir) return
  try {
    const dir = join(/*turbopackIgnore: true*/ dataDir, 'a2a')
    mkdirSync(dir, { recursive: true })
    const line = { at: new Date().toISOString(), channel: rec.channel, verdict: rec.verdict, rules: rec.rules, ...(rec.taskId ? { taskId: rec.taskId } : {}), ...(rec.to ? { to: rec.to } : {}) }
    appendFileSync(join(dir, 'guard-log.jsonl'), JSON.stringify(line) + '\n')
  } catch (e) {
    console.warn('[a2a-guard] the log line was not written:', String(e?.message ?? e))
  }
}
