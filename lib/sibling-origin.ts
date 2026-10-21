import type { NextRequest } from "next/server"
import { nodeCoreOrigin } from "@/lib/own-site"

// «СВОЙ» ИСТОЧНИК ДЛЯ ДВЕРЕЙ, КОТОРЫЕ ЗОВУТ СОСЕДНИЕ ЭЛЕМЕНТЫ УЗЛА ИЗ БРАУЗЕРА (шаги 312, 314-2).
//
// Шапка элемента (`<id>.<зона>`) спрашивает у сайта `/api/me`; ядро (`architect.<зона>`) просит элемент перерисовать
// страницы (`/api/revalidate`, кнопка «Обновить» в Preview). Это чужие источники: без заголовков CORS браузер прячет
// ответ. Свой источник — `https` в ТОЙ ЖЕ ЗОНЕ, что и адрес этого запроса: зона берётся из запроса, а не помнится.
// На машине узла (запрос на `localhost` / `127.0.0.1`) своим считается `localhost` на любом порту — ядро и элементы
// там живут на соседних портах. Чужой домен заголовков не получает никогда.

const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]"])

/** Зона адреса: `blocks.example.com` → `example.com`; `example.com` → `example.com`. */
function zoneOf(host: string): string {
  const labels = host.split(".")
  return labels.length > 2 ? labels.slice(1).join(".") : host
}

export function siblingOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin")
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(":")[0].trim().toLowerCase()
  if (!origin || !host) return null
  let url: URL
  try { url = new URL(origin) } catch { return null }
  if (LOCAL.has(host)) return LOCAL.has(url.hostname) ? url.origin : null
  if (url.protocol !== "https:") return null
  // 324-6: ядро своего узла — своё на любом главном адресе элемента (свой домен — чужая для ядра зона).
  if (url.origin === nodeCoreOrigin()) return url.origin
  const zone = zoneOf(host)
  return url.hostname === zone || url.hostname.endsWith(`.${zone}`) ? url.origin : null
}

/** Заголовки CORS для своего источника; `Vary: Origin` — всегда, чтобы кэш не отдал чужому ответ для своего. */
export function withSiblingCors<T extends Response>(req: NextRequest, res: T): T {
  res.headers.set("Vary", "Origin")
  const origin = siblingOrigin(req)
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin)
    res.headers.set("Access-Control-Allow-Credentials", "true")
  }
  return res
}
