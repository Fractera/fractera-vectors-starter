// @api the core reads and patches this element design brief
import { NextRequest } from "next/server"

import { readBrief, writeBrief } from "@/lib/design-brief"
import { BRIEF_SCHEMA, mergeBrief } from "@/lib/design-brief-shape"
import { bodyOf, keyDenied, reply } from "@/lib/architect/node-settings-door"

// БРИФ ДИЗАЙНА ЭЛЕМЕНТА ДЛЯ ЯДРА (шаг узла 712-1): вкладка ядра «Дизайн» начинается с брифа — для кого сайт, характер, чего избегать,
// референсы. Та же часть `design` паспорта, что правит своя страница элемента (`admin/api/settings/brief`).
// 🔒 ЗАПЛАТА, А НЕ ЗАМЕНА: ядро присылает только изменённые поля, неприсланные остаются (запись о закреплении прототипа — прежде
// всего), `null` стирает поле; итог проверяет та же форма брифа (`normalizeBrief`). Страницы не перерисовываются: бриф читают агент
// элемента и ядро, а не посетитель.
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const denied = keyDenied(req)
  if (denied) return denied
  return reply({ ok: true, config: readBrief(), schema: BRIEF_SCHEMA })
}

export async function PATCH(req: NextRequest) {
  const denied = keyDenied(req)
  if (denied) return denied
  const patch = await bodyOf(req)
  if (typeof patch !== "object" || patch === null || Array.isArray(patch)) return reply({ ok: false, reason: "bad-body" }, 400)
  const r = writeBrief(mergeBrief(readBrief(), patch))
  if (!r.ok) return reply(r, r.reason === "write-failed" || r.reason === "passport-unreadable" ? 500 : 400)
  return reply({ ok: true, config: r.brief })
}
