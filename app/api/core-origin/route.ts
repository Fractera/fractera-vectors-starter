// @api tell the browser the origin of its node core
import { NextResponse } from "next/server"
import { nodeCoreOrigin } from "@/lib/own-site"

// АДРЕС ЯДРА СВОЕГО УЗЛА (шаг 324-6). Островок подсветки принимает команды Preview только от своих: на поддомене ядро в той
// же зоне, а на собственном домене элемента — в чужой. Точный адрес ядра знает сервер элемента (файл домена узла);
// браузер спрашивает его здесь — это число о машине, и в сборку оно не запекается. Адрес ядра публичен: секрета здесь нет.
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ origin: nodeCoreOrigin() }, { headers: { "Cache-Control": "no-store" } })
}
