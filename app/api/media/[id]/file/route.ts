import { dataUrl as nodeDataUrl, isRemoteData } from "@/lib/microservices/urls"
// @api stream one stored media file to the visitor
import { storeHeaders } from "@/lib/fractera/data-service"
import { NextRequest, NextResponse } from "next/server"

const DATA_URL    = nodeDataUrl() ?? ""
// 🔒 ИМЯ КЛЮЧА — DATA_SECRET (найдено на живом сайте 2026-08-13). Здесь стояло
// DATA_API_KEY: такой переменной в окружении сервера нет, ключ получался пустым,
// и прокси пересылал в слой данных COOKIE ПОСЕТИТЕЛЯ. У анонимного гостя сессии
// нет — картинка отвечала 401, а оптимизатор поверх неё 400. То есть ни одно
// изображение из хранилища никогда не было видно публике; не всплывало это лишь
// потому, что показывали статические файлы из public/.
// Оба имени приняты: старое могло попасть в чьё-то окружение.
// 857: the store key is the node's DATA_SECRET, or ELEMENT_KEY for a native born on the node (`storeHeaders`, store-key.mjs); the storage gives it its own
// files and the node's public ones, never a private file through a page; a visitor's cookie is never passed to a store.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const headers: Record<string, string> = storeHeaders()

  try {
    const res = await fetch(`${DATA_URL}/media/${id}/file`, { headers })
    if (!res.ok) return new NextResponse(null, { status: res.status })

    const contentType = res.headers.get("content-type") ?? "application/octet-stream"
    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (e) {
    return new NextResponse(null, { status: 502 })
  }
}
