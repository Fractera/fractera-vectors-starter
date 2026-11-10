// @api take the CONFIG signal that settings changed and refresh pages
// POST /api/settings/changed — сигнал «версия сменилась» от CONFIG (настройки проекта, шаг 306) и сигнал узла «перерисуй»
// (каталог элементов, конец установки). Ключ узла в `X-Settings-Key`. Забирает настройки по MCP и перерисовывает собранные
// страницы без пересборки (`revalidatePath`): страницы остаются статическими — сервер один раз перерисовывает их и дальше
// отдаёт HTML. Модуль — `lib/settings-listener.ts`; оформление элемента — его собственный DESIGN-CONFIG.
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { onSettingsSignal, signalKeyOk, subscribeToConfig } from "@/lib/settings-listener"
import { ownId } from "@/lib/own-id"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  if (!signalKeyOk(req.headers.get("x-settings-key"))) return NextResponse.json({ ok: false, reason: "bad-key" }, { status: 401 })

  const settings = await onSettingsSignal()
  if (!settings.ok && settings.reason !== "no-config-element") console.warn(`[settings] сигнал: настройки не получены — ${settings.reason}`)

  // 662-1: сигнал с ключом узла — и повод подписаться снова. ✗ Замерено на узле владельца 2026-11-06: root, design, graph, cache,
  // memory, stripe стартовали, пока CONFIG перезапускался при `node:update`, подписка не удалась, а повторов нет (закон) — правки
  // CONFIG до них не доходили. Ядро после установки зовёт эту дверь у каждого элемента; подписка по имени заменяет прежнюю запись.
  const who = ownId()
  if (who) {
    const sub = await subscribeToConfig(who)
    if (!sub.ok && sub.reason !== "no-config-element") console.warn(`[settings] сигнал: подписка не удалась — ${sub.reason}`)
  }

  // Перерисовка — по любому сигналу с ключом (как у служб, 308): собранные страницы могли быть построены по другим файлам.
  revalidatePath("/", "layout")
  revalidatePath("/[lang]", "layout")
  revalidatePath("/api/shell/[lang]", "page")
  revalidatePath("/api/menu/[lang]", "page")
  console.log(`[settings] сигнал: настройки ${settings.ok ? (settings.changed ? `новая копия ${settings.version}` : "актуальны") : "недоступны"} — страницы перерисованы`)
  return NextResponse.json({ ok: settings.ok, settings })
}
