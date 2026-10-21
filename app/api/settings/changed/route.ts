// @api take the CONFIG signal that settings changed and refresh pages
// POST /api/settings/changed — сигнал «версия сменилась» от CONFIG (настройки проекта, шаг 306) и от элемента «Дизайн»
// (оформление, шаг 309). Ключ узла в `X-Settings-Key`. Забирает и то и другое по MCP и перерисовывает собранные страницы без
// пересборки (`revalidatePath`): страницы остаются статическими — сервер один раз перерисовывает их и дальше отдаёт HTML.
// Модули — `lib/settings-listener.ts` (CONFIG) и `lib/design-follow.ts` («Дизайн»). Одно не зависит от другого: нет CONFIG —
// оформление всё равно применяется, и наоборот.
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { onSettingsSignal, signalKeyOk } from "@/lib/settings-listener"
import { pullDesign } from "@/lib/design-follow"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  if (!signalKeyOk(req.headers.get("x-settings-key"))) return NextResponse.json({ ok: false, reason: "bad-key" }, { status: 401 })

  // Сигнал не говорит, от кого он: забираем оба источника — это дёшево, а лишний забор отвечает «без изменений».
  const design = await pullDesign()
  if (!design.ok && design.reason !== "no-design-element") console.warn(`[design] сигнал: оформление не получено — ${design.reason}`)
  const settings = await onSettingsSignal()
  if (!settings.ok && settings.reason !== "no-config-element") console.warn(`[settings] сигнал: настройки не получены — ${settings.reason}`)

  // Перерисовка — по любому сигналу с ключом (как у служб, 308): собранные страницы могли быть построены по другим файлам.
  revalidatePath("/", "layout")
  revalidatePath("/[lang]", "layout")
  revalidatePath("/api/shell/[lang]", "page")
  revalidatePath("/api/menu/[lang]", "page")
  console.log(`[settings] сигнал: настройки ${settings.ok ? (settings.changed ? `новая копия ${settings.version}` : "актуальны") : "недоступны"}, оформление ${design.ok ? (design.changed ? "обновлено" : "актуально") : "недоступно"} — страницы перерисованы`)
  return NextResponse.json({ ok: settings.ok || design.ok, settings, design })
}
