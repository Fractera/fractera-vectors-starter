import "server-only"
import { readFileSync } from "fs"
import { join } from "path"
import { elementRoot } from "@/lib/page-tree"

// НАВЫК ДИЗАЙНА ЭЛЕМЕНТА (шаг 333-3/333-4): поле `designSkill` паспорта `OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json` — имя навыка или ""
// (владелец 2026-10-07: поле живёт в паспорте всегда; перенос 417 в NODE-CONTRACT.json отменён). Читается сервером из папки
// элемента (`ELEMENT_DIR`) и уходит в островки пропсом. Пустое поле или нет паспорта — `null`.
export function designSkill(): string | null {
  try {
    const props = JSON.parse(readFileSync(join(elementRoot(), "OWN-SERVICE-PROPS", "OWN-SERVICE-PROPS.json"), "utf8")) as { designSkill?: unknown }
    return typeof props.designSkill === "string" && props.designSkill.trim() ? props.designSkill.trim() : null
  } catch {
    return null
  }
}
