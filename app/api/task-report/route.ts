// @api the build's task report for the preview window on this machine
import { NextRequest, NextResponse } from "next/server"
import report from "@/TASK-REPORT.json"

// ОТЧЁТ О ЗАДАЧЕ ЭТОЙ СБОРКИ (узел, шаг 356-2). Слово владельца 2026-10-01: «в параметрах строки … report-modal … окно в котором ты
// достаточно подробно рассказываешь какая была сделана задача и какие в итоге получены результаты».
// 🔒 ОТЧЁТ ВШИТ В СБОРКУ (импорт `TASK-REPORT.json`): предпросмотр — это сборка коммита, значит и отчёт ровно этого коммита; собранный
// сервер Next меняет рабочую папку на папку сборки, поэтому чтение с диска здесь лгало бы.
// 🔒 ТОЛЬКО НА ЭТОЙ МАШИНЕ: Host — 127.0.0.1 или localhost и нет заголовка Cloudflare. На живом сайте (через туннель, по домену) —
// 404: отчёт для архитектора, не для посетителя. В адресе страницы — только `?report=<коммит>`, текста там нет.
export const dynamic = "force-dynamic"

export function GET(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").replace(/:\d+$/, "")
  const local = (host === "127.0.0.1" || host === "localhost" || host === "[::1]") && !req.headers.get("cf-connecting-ip")
  if (!local) return NextResponse.json({ ok: false }, { status: 404 })
  const r = report as { task?: string; done?: string[]; check?: string[]; path?: string; anchor?: string }
  if (!r.task) return NextResponse.json({ ok: true, report: null }, { headers: { "Cache-Control": "no-store" } })
  return NextResponse.json({ ok: true, report: r }, { headers: { "Cache-Control": "no-store" } })
}
