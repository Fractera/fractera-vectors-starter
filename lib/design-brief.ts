import "server-only"
import { readFileSync, renameSync, writeFileSync } from "fs"
import { join } from "path"
import { elementRoot } from "@/lib/page-tree"

// БРИФ ДИЗАЙНА ЭЛЕМЕНТА (шаг 706-4). Владелец 2026-11-09: «На вкладке дизайн создать Бриф где пользователь выбирает один из навыков
// дизайна и загружают референсы»; «имеет смысл новых дизайна добавить к own-service-props.json ну возможно ещё и ссылку на референс».
//
// Бриф — часть `design` паспорта `OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json`: для кого сайт, характер в 3–5 словах, референсы (ссылка и/или
// загруженная картинка из своего хранилища — `media`), чего избегать, навык дизайна. Поле `designSkill` паспорта идёт в ногу с `design.skill`
// (его читают индикатор и `npm run design-skill`). Дизайн-проход агента читает бриф первым (`.claude/modes/build-design.md`); ядро забирает
// его вместе с описанием («Забрать в ядро») — так сосед рождается «как этот элемент» (`create --look-like`).
// Форма — `lib/design-brief-shape.ts` (те же правила, что у ядра).
import { normalizeBrief, type DesignBrief } from "@/lib/design-brief-shape"
export { normalizeBrief, type DesignBrief, type BriefReference, type BriefPinned } from "@/lib/design-brief-shape"

const passportPath = () => join(elementRoot(), "OWN-SERVICE-PROPS", "OWN-SERVICE-PROPS.json")

/** Бриф из паспорта; навык без брифа — навык из `designSkill`. */
export function readBrief(): DesignBrief {
  try {
    const p = JSON.parse(readFileSync(passportPath(), "utf8")) as { design?: unknown; designSkill?: unknown }
    const n = normalizeBrief(p.design)
    const brief = n.ok && n.brief ? n.brief : {}
    if (!brief.skill && typeof p.designSkill === "string" && p.designSkill.trim()) brief.skill = p.designSkill.trim()
    return brief
  } catch {
    return {}
  }
}

/** Записать бриф в паспорт (целиком, атомарно); `designSkill` — в ногу с `design.skill`. */
export function writeBrief(raw: unknown): { ok: true; brief: DesignBrief } | { ok: false; reason: string } {
  const n = normalizeBrief(raw)
  if (!n.ok) return n
  const file = passportPath()
  let props: Record<string, unknown>
  try { props = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown> } catch { return { ok: false, reason: "passport-unreadable" } }
  const brief = n.brief ?? {}
  if (Object.keys(brief).length) props.design = brief
  else delete props.design
  if (brief.skill) props.designSkill = brief.skill
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  try {
    writeFileSync(tmp, JSON.stringify(props, null, 2) + "\n", "utf8")
    renameSync(tmp, file)
  } catch { return { ok: false, reason: "write-failed" } }
  return { ok: true, brief }
}
