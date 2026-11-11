// @api read and change this element's design brief (the passport's design part)
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/get-session"
import { readBrief, writeBrief } from "@/lib/design-brief"

// БРИФ ДИЗАЙНА ЭЛЕМЕНТА (шаг 706-4): `GET/PUT /<lang>/admin/api/settings/brief` — часть `design` паспорта. Пишут архитектор и администратор
// этого приложения (закон двери оформления рядом, 580-4). Бриф — не оформление: связь с общим «Дизайном» его не запирает.
// Страницы не перерисовываются: бриф читает агент элемента и ядро, а не посетитель.
export const dynamic = "force-dynamic"

async function allowed(req: NextRequest): Promise<200 | 401 | 403> {
  const s = await getSession(req)
  if (!s) return 401
  return (s.roles ?? []).some((r) => r === "architect" || r === "admin") ? 200 : 403
}

export async function GET(req: NextRequest) {
  const a = await allowed(req)
  if (a !== 200) return NextResponse.json({ ok: false }, { status: a })
  return NextResponse.json({ ok: true, brief: readBrief() }, { headers: { "Cache-Control": "no-store" } })
}

export async function PUT(req: NextRequest) {
  const a = await allowed(req)
  if (a !== 200) return NextResponse.json({ ok: false }, { status: a })
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, reason: "bad-body" }, { status: 400 }) }
  const r = writeBrief(body)
  if (!r.ok) return NextResponse.json(r, { status: r.reason === "write-failed" || r.reason === "passport-unreadable" ? 500 : 400 })
  return NextResponse.json({ ok: true, brief: r.brief }, { headers: { "Cache-Control": "no-store" } })
}
