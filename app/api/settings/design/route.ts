// @api read and change this site's design settings for the node core
import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

import { readRawDesignConfig, writeDesignPatch } from "@/lib/architect/design-config-writer"

// ДВЕРЬ НАСТРОЕК САЙТА — ОФОРМЛЕНИЕ (280-6).
//
// 🔒 НАСТРОЙКИ ПРИНАДЛЕЖАТ САЙТУ, ЯДРО ДОТЯГИВАЕТСЯ (закон направления потока, слово владельца
// 2026-09-23): «сайт содержит свои собственные конфиги которые могут из ядра быть прочитаны
// обновлены и записаны обратно … сайт будет жив даже если ядра не будет существовать».
// Файл — `DESIGN-CONFIG/design-config.json` этого сайта; ядро его не хранит и не копирует.
//
// 🔒 КЛЮЧ, А НЕ РОЛЬ. Ядро приходит без сессии посетителя. Ключ `SETTINGS_SECRET` установщик узла
// генерирует один раз и кладёт в оба конца. Ключа в окружении нет — дверь закрыта для всех.
//
// 🛑 ЗАПИСЬ НЕ МЕНЯЕТ СТРАНИЦЫ САМА. Оформление запекается в статические страницы на сборке;
// пересобрать сайт — дело того, кто правил (ядро), и ответ говорит об этом словами.
export const dynamic = "force-dynamic"

function keyOk(req: NextRequest): boolean {
  const expected = process.env.SETTINGS_SECRET ?? ""
  const given = req.headers.get("x-settings-key") ?? ""
  if (!expected || given.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected))
}

const denied = () => NextResponse.json({ ok: false, reason: "bad-key" }, { status: 401 })

export async function GET(req: NextRequest) {
  if (!keyOk(req)) return denied()
  return NextResponse.json({ ok: true, config: readRawDesignConfig() }, { headers: { "Cache-Control": "no-store" } })
}

export async function PATCH(req: NextRequest) {
  if (!keyOk(req)) return denied()
  let patch: unknown
  try {
    patch = await req.json()
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-body" }, { status: 400 })
  }
  const result = writeDesignPatch(patch)
  if (!result.ok) return NextResponse.json(result, { status: result.reason === "bad-body" ? 400 : 500 })
  return NextResponse.json({ ok: true, config: result.config, rebuildNeeded: true })
}
