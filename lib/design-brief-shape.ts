// ФОРМА БРИФА ДИЗАЙНА (шаг 706-4) — чистая функция без импортов: её зовёт запись паспорта (`lib/design-brief.ts`) и проверяет
// `npm run test:design-brief`. Правила те же, что у ядра (`lib/web4-items/element-look.cjs` ядра): элемент живёт и без ядра.
export type BriefReference = { url?: string; media?: string; note?: string }
/** 711-6: the pinned prototype — written by `npm run design:pin`, kept by every later brief save. */
export type BriefPinned = { prototype: string; skill: string; at: string; references?: { url: string; caption?: string }[] }
export type DesignBrief = { skill?: string; audience?: string; character?: string[]; avoid?: string; references?: BriefReference[]; inheritedFrom?: string; pinned?: BriefPinned }

/** 711: a skill found by the core's search is named by its mark — a bare name, `owner/repo@skill` or `own:…` / `skill:src:name`. */
const SKILL_MARK = /^[a-zA-Z0-9][a-zA-Z0-9._:/@-]{0,119}$/
const ID = /^[a-z][a-z0-9]{3,23}$/
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "")
/** Проверить и очистить бриф; `null` в `brief` — бриф пуст. */
export function normalizeBrief(raw: unknown): { ok: true; brief: DesignBrief | null } | { ok: false; reason: string } {
  if (raw === undefined || raw === null) return { ok: true, brief: null }
  if (!isObj(raw)) return { ok: false, reason: "bad-shape" }
  const b: DesignBrief = {}
  if (raw.skill !== undefined && raw.skill !== "") {
    if (typeof raw.skill !== "string" || !SKILL_MARK.test(raw.skill.trim())) return { ok: false, reason: "bad-skill" }
    b.skill = raw.skill.trim()
  }
  const audience = text(raw.audience, 600)
  if (audience) b.audience = audience
  if (raw.character !== undefined) {
    if (!Array.isArray(raw.character) || raw.character.length > 5) return { ok: false, reason: "too-many-words" }
    const words = raw.character.map((w) => text(w, 40)).filter(Boolean)
    if (words.length) b.character = words
  }
  const avoid = text(raw.avoid, 600)
  if (avoid) b.avoid = avoid
  if (raw.references !== undefined) {
    if (!Array.isArray(raw.references) || raw.references.length > 12) return { ok: false, reason: "too-many-references" }
    const refs: BriefReference[] = []
    for (const r of raw.references) {
      if (!isObj(r)) return { ok: false, reason: "bad-shape" }
      const ref: BriefReference = {}
      const url = text(r.url, 500)
      if (url) {
        if (!/^https?:\/\//.test(url)) return { ok: false, reason: "bad-link" }
        ref.url = url
      }
      const media = text(r.media, 80)
      if (media) ref.media = media
      const note = text(r.note, 300)
      if (note) ref.note = note
      if (ref.url || ref.media || ref.note) refs.push(ref)
    }
    if (refs.length) b.references = refs
  }
  if (typeof raw.inheritedFrom === "string" && ID.test(raw.inheritedFrom)) b.inheritedFrom = raw.inheritedFrom
  // 711-6: the pin record is the element's own fact (written by `npm run design:pin`); a brief save keeps it as it is.
  if (isObj(raw.pinned) && typeof raw.pinned.prototype === "string" && /^[a-z0-9][a-z0-9-]{0,47}$/.test(raw.pinned.prototype) && typeof raw.pinned.skill === "string" && SKILL_MARK.test(raw.pinned.skill) && typeof raw.pinned.at === "string") {
    const refs = Array.isArray(raw.pinned.references) ? raw.pinned.references.filter(isObj).map((r) => ({ url: text(r.url, 500), ...(text(r.caption, 300) ? { caption: text(r.caption, 300) } : {}) })).filter((r) => /^(https?:\/\/|\/)/.test(r.url)).slice(0, 12) : []
    b.pinned = { prototype: raw.pinned.prototype, skill: raw.pinned.skill, at: text(raw.pinned.at, 40), ...(refs.length ? { references: refs } : {}) }
  }
  return { ok: true, brief: Object.keys(b).length ? b : null }
}


/**
 * 712-1: the brief's declaration for the core's remote control — the fields a brief holds, as JSON Schema (the shape `normalizeBrief`
 * keeps). The core shows only the fields it knows AND this declaration names; a field removed here disappears from the core's tab.
 */
export const BRIEF_SCHEMA = {
  type: "object",
  properties: {
    skill: { type: "string" },
    audience: { type: "string" },
    character: { type: "array", items: { type: "string" } },
    avoid: { type: "string" },
    references: { type: "array", items: { type: "object", properties: { url: { type: "string" }, media: { type: "string" }, note: { type: "string" } } } },
    inheritedFrom: { type: "string" },
    pinned: { type: "object" },
  },
} as const

/** 712-1: a merge patch over the current brief — `null` removes a field; a field not sent stays as it is (the pin record first of all). */
export function mergeBrief(current: DesignBrief, patch: unknown): unknown {
  if (!isObj(patch)) return patch
  const out: Record<string, unknown> = { ...current }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete out[k]
    else out[k] = v
  }
  return out
}
