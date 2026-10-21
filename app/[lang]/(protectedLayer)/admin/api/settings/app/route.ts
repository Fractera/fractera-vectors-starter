// @api read and change this element own site settings when CONFIG is off
import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { getSession } from "@/lib/auth/get-session"
import { getAppConfig } from "@/config/app-config"
import { linkOn } from "@/lib/own-site"

// СВОИ НАСТРОЙКИ ЭЛЕМЕНТА (шаг 324-8). Решение владельца 2026-09-28: отключившись от CONFIG, элемент должен иметь свои
// записи и тот же интерфейс настроек — «повторить интерфейс настроек app CONFIG … всё скопировать и адаптировать»;
// вариант «б» — редактор живёт в самом элементе. Островки редактора — копия CONFIG (`components/site-settings/`), и они
// ходят сюда тем же путём, что в CONFIG: `GET/PATCH /<lang>/admin/api/settings/app`.
//
// 🔒 ПИШЕТ ТОЛЬКО АРХИТЕКТОР И ТОЛЬКО ПРИ ОТКЛЮЧЁННОМ CONFIG. Пока связь включена, настройки приходят из CONFIG и лягут
// поверх любой правки здесь — принять её значило бы пообещать несбыточное: ответ 409 `config-connected`.
// 🔒 ЗАПЛАТА — JSON MERGE PATCH (как у CONFIG): `null` удаляет ключ. Файл — `APP_CONFIG_PATH` (абсолютный путь от
// установщика: собранный сервер работает из папки сборки). `url` не правится здесь: адрес элемента задаёт узел
// («Главный адрес»). После записи страницы перерисовываются.
export const dynamic = "force-dynamic"

const FILE = process.env.APP_CONFIG_PATH ?? join(process.cwd(), "APP-CONFIG", "app-config.json")
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

function mergePatch(target: unknown, patch: unknown): unknown {
  if (!isObj(patch)) return patch
  const out: Record<string, unknown> = isObj(target) ? { ...target } : {}
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete out[k]
    else out[k] = mergePatch(out[k], v)
  }
  return out
}

async function architect(req: NextRequest): Promise<200 | 401 | 403> {
  const s = await getSession(req)
  if (!s) return 401
  return s.roles?.includes("architect") ? 200 : 403
}

export async function GET(req: NextRequest) {
  const a = await architect(req)
  if (a !== 200) return NextResponse.json({ ok: false }, { status: a })
  return NextResponse.json({ ok: true, linked: linkOn("config"), config: getAppConfig() }, { headers: { "Cache-Control": "no-store" } })
}

export async function PATCH(req: NextRequest) {
  const a = await architect(req)
  if (a !== 200) return NextResponse.json({ ok: false }, { status: a })
  if (linkOn("config")) return NextResponse.json({ ok: false, reason: "config-connected" }, { status: 409 })
  let patch: unknown
  try { patch = await req.json() } catch { return NextResponse.json({ ok: false, reason: "bad-body" }, { status: 400 }) }
  if (!isObj(patch)) return NextResponse.json({ ok: false, reason: "bad-body" }, { status: 400 })
  delete patch.url
  let current: unknown = {}
  // Концы строк файла сохраняются: APP-CONFIG живёт в git элемента, смена CRLF на LF была бы правкой без содержания.
  let eol = "\n"
  try {
    const text = readFileSync(FILE, "utf8")
    current = JSON.parse(text)
    if (text.includes("\r\n")) eol = "\r\n"
  } catch { /* нет файла — начинаем с пустого */ }
  const next = mergePatch(current, patch)
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
  return NextResponse.json({ ok: true, config: getAppConfig() }, { headers: { "Cache-Control": "no-store" } })
}
