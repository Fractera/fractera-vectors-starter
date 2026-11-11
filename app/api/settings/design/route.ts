// @api the core reads and patches this element own design
import { NextRequest } from "next/server"
import { z } from "zod"

import { readRawDesignConfig, writeDesignPatch } from "@/lib/architect/design-config-writer"
import { designConfigSchema } from "@/config/design-config.schema"
import { bodyOf, keyDenied, repaint, reply } from "@/lib/architect/node-settings-door"

// ДВЕРЬ НАСТРОЕК САЙТА — ОФОРМЛЕНИЕ (280-6; 712-1 — пульт ядра).
//
// 🔒 НАСТРОЙКИ ПРИНАДЛЕЖАТ САЙТУ, ЯДРО ДОТЯГИВАЕТСЯ (закон направления потока, слово владельца 2026-09-23): «сайт содержит свои
// собственные конфиги которые могут из ядра быть прочитаны обновлены и записаны обратно … сайт будет жив даже если ядра не будет
// существовать». Файл — `DESIGN-CONFIG/design-config.json` этого сайта; ядро его не хранит и не копирует.
// 🔒 712-1 (владелец 2026-11-09: «в ядре будут представлены только те строки которые совпадают с предварительно созданными в ядре»):
// чтение отдаёт и ОБЪЯВЛЕНИЕ полей — JSON Schema из схемы этого элемента (`config/design-config.schema.ts`, та же, что порождает
// `DESIGN-CONFIG/schema.json`). Убрали поле из схемы — ядро его не покажет; добавили своё — ядро его не знает и тоже не покажет.
// 🔒 ЗАПИСЬ — ЗАПЛАТА (`writeDesignPatch`: глубокая, `null` стирает ключ), и страницы перерисовываются без сборки — оформление
// читается при отрисовке (`config/design-config.ts`). Прежнее «нужна пересборка» (280-6) устарело с шагом 309.
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const denied = keyDenied(req)
  if (denied) return denied
  return reply({ ok: true, config: readRawDesignConfig(), schema: z.toJSONSchema(designConfigSchema, { io: "input" }) })
}

export async function PATCH(req: NextRequest) {
  const denied = keyDenied(req)
  if (denied) return denied
  const result = writeDesignPatch(await bodyOf(req))
  if (!result.ok) return reply(result, result.reason === "bad-body" ? 400 : 500)
  repaint()
  return reply({ ok: true, config: result.config })
}
