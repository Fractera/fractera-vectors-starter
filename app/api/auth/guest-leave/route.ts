// @api a guest deletes their own guest account and leaves
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/get-session"
import { authUrl as nodeAuthUrl } from "@/lib/microservices/urls"
import { connectedDomainAuthBase } from "@/lib/auth-base-server"
import { TICKET_COOKIE } from "@/lib/auth/ticket"

// «УДАЛИТЬ МОЮ УЧЁТНУЮ ЗАПИСЬ И ПОКИНУТЬ САЙТ» (узел, шаг 331-2). Только для гостя: кто это — сервер узнаёт сам по сессии
// (`getSession`), а не верит браузеру. Запись удаляет служба входа по петле машины (`/api/auth/guest/leave` — только гостя);
// здесь гасятся куки, по которым человека узнавал этот сайт: билет единого входа (свой домен) и кука службы входа на зоне узла.
// 🔒 Запрос только со своей страницы (Origin — этот же хост): чужой сайт не удалит гостя, заманив его на свою кнопку.

export async function POST(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim().toLowerCase()
  const origin = req.headers.get("origin")
  try { if (!origin || new URL(origin).host.toLowerCase() !== host) return NextResponse.json({ error: "bad-origin" }, { status: 403 }) }
  catch { return NextResponse.json({ error: "bad-origin" }, { status: 403 }) }
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: "no-session" }, { status: 401 })
  if (!(session.roles.length === 1 && session.roles[0] === "guest")) return NextResponse.json({ error: "not-a-guest" }, { status: 403 })
  const auth = nodeAuthUrl()
  if (!auth) return NextResponse.json({ error: "no-auth-service" }, { status: 503 })
  let r: Response
  try {
    r = await fetch(`${auth}/api/auth/guest/leave`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: session.userId }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    return NextResponse.json({ error: "auth-unreachable" }, { status: 502 })
  }
  if (!r.ok) return NextResponse.json({ error: "auth-refused", status: r.status }, { status: 502 })
  const out = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  const secure = !/^(localhost|127\.0\.0\.1)(:|$)/.test(host)
  out.cookies.set(TICKET_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, secure, sameSite: "lax" })
  const center = connectedDomainAuthBase()
  const zone = center ? new URL(center).hostname.replace(/^auth\./, "") : ""
  const bare = host.split(":")[0]
  if (zone && (bare === zone || bare.endsWith(`.${zone}`))) {
    for (const name of ["__Secure-authjs.session-token", "authjs.session-token"]) {
      out.headers.append("set-cookie", `${name}=; Domain=.${zone}; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${name.startsWith("__Secure-") ? "; Secure" : secure ? "; Secure" : ""}`)
    }
  }
  return out
}
