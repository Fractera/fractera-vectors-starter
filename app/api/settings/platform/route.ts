// @api the architect closes the screen-width badge of this element
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { getSession } from "@/lib/auth/get-session"

// ЗАКРЫТЬ ИНДИКАТОР ШИРИНЫ (шаг 333-4). Слово владельца: «кнопку закрыть, который перепрописывает собственный CONFIG и делает
// так чтобы он больше не появлялся пока его снова не включит»; выбор владельца — закрывает «только архитектор».
// 🔒 ПИШЕТ ОДИН КЛЮЧ — `features.viewportBadge` в своём `PLATFORM-CONFIG` элемента (абсолютный путь от установщика). Своё
// значение этого ключа сильнее копии CONFIG (`config/platform-config.ts`): это инструмент разработчика элемента, а не решение
// проекта, иначе при включённой связи закрытие не действовало бы. Включить снова — `true` в том же файле.
export const dynamic = "force-dynamic"

const FILE = process.env.PLATFORM_CONFIG_PATH ?? join(process.cwd(), "PLATFORM-CONFIG", "platform-config.json")
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

export async function POST(req: NextRequest) {
  const s = await getSession(req)
  if (!s) return NextResponse.json({ ok: false }, { status: 401 })
  if (!s.roles?.includes("architect")) return NextResponse.json({ ok: false }, { status: 403 })
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, reason: "bad-body" }, { status: 400 }) }
  if (!isObj(body) || typeof body.viewportBadge !== "boolean") return NextResponse.json({ ok: false, reason: "bad-body" }, { status: 400 })
  let current: Record<string, unknown> = {}
  let eol = "\n"
  try {
    const text = readFileSync(FILE, "utf8")
    const parsed = JSON.parse(text)
    if (isObj(parsed)) current = parsed
    if (text.includes("\r\n")) eol = "\r\n"
  } catch { /* нет файла — начинаем с пустого */ }
  const features = isObj(current.features) ? current.features : {}
  const next = { ...current, features: { ...features, viewportBadge: body.viewportBadge } }
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`
  try {
    mkdirSync(dirname(FILE), { recursive: true })
    writeFileSync(tmp, (JSON.stringify(next, null, 2) + "\n").replace(/\n/g, eol), "utf8")
    renameSync(tmp, FILE)
  } catch {
    return NextResponse.json({ ok: false, reason: "write-failed" }, { status: 500 })
  }
  revalidatePath("/", "layout")
  revalidatePath("/[lang]", "layout")
  return NextResponse.json({ ok: true, viewportBadge: body.viewportBadge }, { headers: { "Cache-Control": "no-store" } })
}
