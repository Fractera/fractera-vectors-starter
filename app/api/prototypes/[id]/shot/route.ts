// @api the architect gets a design prototype screenshot for its preview
import { NextRequest, NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { getSession } from "@/lib/auth/get-session"
import { prototypeDir } from "@/lib/prototypes"

// СНИМОК ПРОТОТИПА ДИЗАЙНА (узел, шаг 715; владелец 2026-11-10: «справа как раз поставь маленькое превью»). Снимки лежат в папке
// прототипа `prototypes/_pages/<id>/shots/{desktop,mobile}.png` — их кладёт агент элемента после генерации, ядро читает их с диска для
// карусели. Эта дверь отдаёт тот же файл списку прототипов элемента.
// 🔒 ТОЛЬКО АРХИТЕКТОРУ — тот же замок, что у ветки «Прототипы дизайна»: снимок показывает облик до его выбора.
// 🔒 ИМЯ ПРОВЕРЯЕТСЯ ДО ПУТИ (`prototypeDir`), вид — из двух слов; иначе 404.
export const dynamic = "force-dynamic"
const KINDS = new Set(["desktop", "mobile"])

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession(req)
  if (!s) return NextResponse.json({ ok: false }, { status: 401 })
  if (!s.roles?.includes("architect")) return NextResponse.json({ ok: false }, { status: 403 })
  const { id } = await ctx.params
  const kind = req.nextUrl.searchParams.get("kind") ?? "desktop"
  const dir = prototypeDir(id)
  if (!dir || !KINDS.has(kind)) return NextResponse.json({ ok: false }, { status: 404 })
  try {
    const png = await readFile(join(dir, "shots", `${kind}.png`))
    return new NextResponse(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" } })
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 })
  }
}
