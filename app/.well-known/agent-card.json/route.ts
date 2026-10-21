import { readFileSync } from "node:fs"
import { join } from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { elementRoot } from "@/lib/page-tree"
import { hiddenFrom } from "@/lib/a2a/boundary"
import { cardJson } from "@/lib/a2a/card"

const EXT = "https://fractera.ai/a2a/ext/node/v1"

// Подключён ли Telegram этого элемента (шаг узла 408-5; владелец: «в собственных свойствах и в общем … реестре»): токен и
// хотя бы один допущенный в своей папке бота `SERVICE_DATA_DIR/channel/telegram`. Ядро меряет ту же папку для реестра.
function telegramConnected(): boolean {
  const dir = process.env.SERVICE_DATA_DIR?.trim()
  if (!dir) return false
  try {
    const env = readFileSync(join(dir, "channel", "telegram", ".env"), "utf8")
    // 432 (✗ 2026-10-07): здесь стояло `=S+` — потерянная обратная косая черта; токен из цифр не совпадал никогда, и визитка
    // всегда говорила «Telegram не подключён».
    const token = /^TELEGRAM_BOT_TOKEN=\S+/m.test(env)
    const access = JSON.parse(readFileSync(join(dir, "channel", "telegram", "access.json"), "utf8")) as { allowFrom?: unknown }
    return token && Array.isArray(access.allowFrom) && access.allowFrom.length > 0
  } catch {
    return false
  }
}

// ВИЗИТКА A2A ЭЛЕМЕНТА — адрес обнаружения по спецификации A2A v1.0 (`/.well-known/agent-card.json`; шаг узла 406-3).
// Источник (417) — `OWN-SERVICE-PROPS/A2A-CARD.json` + имя, описание, версия из паспорта, читается при запросе: правка паспорта видна без пересборки.
// `supportedInterfaces` — только настоящие конечные точки A2A: адрес из `a2aEndpoint` расширения (привязка JSON-RPC, v1.0)
// на том хосте, по которому пришли за визиткой. Свои двери —
// в расширении `https://fractera.ai/a2a/ext/node/v1` (стандарт узла: lib/a2a/STANDARD.md в ядре).
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // Граница узла: визитку внутреннего элемента извне не отдаём и существование не раскрываем — 404.
  if (hiddenFrom(req.headers)) return NextResponse.json({ error: "not-found" }, { status: 404 })
  try {
    // 417/418: визитка = тело стандарта (A2A-CARD.json) + имя, описание и версия из паспорта — общая функция lib/a2a/card.ts.
    const card = cardJson() as any
    if (!card) return NextResponse.json({ error: "no-card" }, { status: 404 })
    const endpoint = card.capabilities?.extensions?.find((e: { uri?: string }) => e.uri === EXT)?.params?.a2aEndpoint
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
    const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "")
    const supportedInterfaces = typeof endpoint === "string" && host ? [{ url: `${proto}://${host}${endpoint}`, protocolBinding: "JSONRPC", protocolVersion: "1.0" }] : []
    const extensions = (card.capabilities?.extensions ?? []).map((e: { uri?: string; params?: Record<string, unknown> }) =>
      e.uri === EXT ? { ...e, params: { ...(e.params ?? {}), telegram: { connected: telegramConnected() } } } : e)
    // 432 (владелец 2026-10-07: «1 и 2 делай»): необязательные поля A2A v1.0 `documentationUrl` и `iconUrl` — на том же хосте,
    // что и конечная точка: документация для агентов — `llms.txt` сайта, значок — значок сайта.
    const origin = host ? `${proto}://${host}` : ""
    const links = origin ? { documentationUrl: `${origin}/llms.txt`, iconUrl: `${origin}/icons/icon-512.png` } : {}
    return NextResponse.json({ ...card, ...links, capabilities: { ...card.capabilities, extensions }, supportedInterfaces }, { headers: { "Access-Control-Allow-Origin": "*" } })
  } catch {
    return NextResponse.json({ error: "no-passport" }, { status: 404 })
  }
}
