// @api take a sign-in code from the node centre and set a ticket
import { NextRequest, NextResponse } from "next/server"
import { authUrl as nodeAuthUrl } from "@/lib/microservices/urls"
import { TICKET_COOKIE } from "@/lib/auth/ticket"

// ВОЗВРАТ ИЗ ЦЕНТРА ЕДИНОГО ВХОДА (узел, шаг 328-3). На собственном домене элемента кука службы входа узла не живёт, поэтому
// центр присылает сюда одноразовый код (`?code=`, `?next=` — путь, куда вернуть человека). Сервер элемента меняет код на
// билет у центра ПО ПЕТЛЕ МАШИНЫ (`/api/auth/exchange`, снаружи центр его не принимает) и ставит билет своей кукой на свой
// адрес. Дальше `getSession` узнаёт человека по билету; выход в центре гасит билет.
// 🔒 `next` — только путь этого же сайта (начинается с одного `/`): иначе дверь стала бы открытой переадресацией.

const MONTH = 30 * 24 * 60 * 60

export async function GET(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim()
  const secure = (req.headers.get("x-forwarded-proto") ?? "").startsWith("https") || !/^(localhost|127\.0\.0\.1)(:|$)/.test(host)
  const origin = `${secure ? "https" : "http"}://${host}`
  const raw = req.nextUrl.searchParams.get("next") ?? "/"
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/"
  const back = NextResponse.redirect(new URL(next, origin), 302)
  const code = req.nextUrl.searchParams.get("code") ?? ""
  const auth = nodeAuthUrl()
  if (!code || !auth) return back
  try {
    const r = await fetch(`${auth}/api/auth/exchange`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, origin }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })
    if (!r.ok) return back
    const { ticket } = (await r.json()) as { ticket?: string }
    if (typeof ticket === "string" && ticket) {
      back.cookies.set(TICKET_COOKIE, ticket, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: MONTH })
    }
  } catch { /* центр не ответил — человек вернётся гостем и сможет нажать «Войти» снова */ }
  return back
}
