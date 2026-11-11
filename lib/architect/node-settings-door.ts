import "server-only"
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { signalKeyOk } from "@/lib/settings-listener"

// ДВЕРИ НАСТРОЕК ДЛЯ ЯДРА — ОБЩИЕ ПРИЁМЫ (шаг узла 712-1). Владелец 2026-11-09: «ядро всего лишь навсего представляет доступ к …
// настройкам которые сейчас существуют в элементе. То есть это удалённый пульт управления». Четыре двери `app/api/settings/{design,app,
// features,brief}` отдают ядру значения И объявление полей (JSON Schema из схемы самого элемента), принимают заплату.
//
// 🔒 КЛЮЧ, А НЕ РОЛЬ (280-6): ядро приходит без сессии посетителя; `SETTINGS_SECRET` установщик кладёт в оба конца. Ключа нет — закрыто.
// 🔒 ПОСЛЕ ЗАПИСИ СТРАНИЦЫ ПЕРЕРИСОВЫВАЮТСЯ БЕЗ СБОРКИ: настройки читаются при отрисовке (`config/*-config.ts`), как после правки на
// своих страницах элемента.

export const NO_STORE = { "Cache-Control": "no-store" }

export const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE })

/** 401 без ключа узла; `null` — ключ верный. */
export function keyDenied(req: NextRequest): NextResponse | null {
  return signalKeyOk(req.headers.get("x-settings-key")) ? null : reply({ ok: false, reason: "bad-key" }, 401)
}

/** Тело запроса или `undefined` — не JSON. */
export async function bodyOf(req: NextRequest): Promise<unknown> {
  try { return await req.json() } catch { return undefined }
}

/** Перерисовать собранные страницы и оболочку (шапку, подвал, меню) — те же адреса, что у сессионных дверей. */
export function repaint(): void {
  revalidatePath("/", "layout")
  revalidatePath("/[lang]", "layout")
  revalidatePath("/api/shell/[lang]", "page")
  revalidatePath("/api/menu/[lang]", "page")
}
