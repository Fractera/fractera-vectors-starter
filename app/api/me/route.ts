// @api tell the browser who is signed in and with which roles
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/get-session"
import { withSiblingCors } from "@/lib/sibling-origin"

// 🔒 СОСЕДНИЕ ЭЛЕМЕНТЫ УЗЛА ЧИТАЮТ ОТВЕТ (шаг 312): шапка элементов на `<id>.<зона>` спрашивает эту дверь из браузера —
// своей двери «кто вошёл» у них нет. Кто считается своим — `lib/sibling-origin.ts` (одно правило на все такие двери).
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return withSiblingCors(req, NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
  return withSiblingCors(req, NextResponse.json(session))
}
