"use client"

import { useEffect, useState } from "react"
import { AppDialog } from "@/components/dialog/app-dialog.client"
import type { AppDialogUi } from "@/components/dialog/app-dialog.i18n"
import type { TaskReportWords } from "./task-report.i18n"

// ОКНО ОТЧЁТА О ЗАДАЧЕ (узел, шаг 356-2). Слово владельца 2026-10-01: «…&report-modal=… перехват такого параметра и вывод на окно …
// Закрытие этого окна удаляет данный параметр». Открывается, только если в адресе есть `?report=` и страница открыта на этой машине
// (127.0.0.1 / localhost — так открывается предпросмотр); отчёт берётся у двери `/api/task-report` (вшит в сборку). До оживления
// ничего не рисует — статике и поиску не мешает. Закрытие убирает `report` из адреса, якорь и прочие параметры остаются, и страница
// встаёт у блока из якоря (356-4).
type Report = { task: string; done?: string[]; check?: string[] }

export function TaskReport({ words, dialogUi }: { words: TaskReportWords; dialogUi: AppDialogUi }) {
  const [report, setReport] = useState<Report | null | "missing">(null)

  useEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has("report")) return
    if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) return
    fetch("/api/task-report", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { report?: Report | null } | null) => setReport(d?.report ?? "missing"))
      .catch(() => setReport("missing"))
  }, [])

  function close() {
    setReport(null)
    const url = new URL(window.location.href)
    url.searchParams.delete("report")
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash)
    // 356-4 (замерено: `#<data-block>` браузер сам не прокручивает — страница стояла наверху). Закрыл отчёт — страница у изменённого
    // блока: якорь ищется по `id` и по `data-block`. 🛑 Прокрутка мгновенная и только своего документа (уроки 318: плавная в браузере
    // владельца не доходила, `scrollIntoView` двигал и окно ядра).
    const anchor = decodeURIComponent(url.hash.slice(1))
    const el = anchor ? (document.getElementById(anchor) ?? document.querySelector(`[data-block="${CSS.escape(anchor)}"]`)) : null
    if (el) {
      const r = el.getBoundingClientRect()
      const gap = r.height < window.innerHeight ? (window.innerHeight - r.height) / 2 : 16
      window.scrollTo({ top: Math.max(0, window.scrollY + r.top - gap), behavior: "instant" })
    }
  }

  if (report === null) return null
  return (
    <AppDialog
      open
      onOpenChange={(o) => { if (!o) close() }}
      title={words.title}
      description={report === "missing" ? words.missing : report.task}
      ui={dialogUi}
    >
      {report !== "missing" && (
        <div className="flex flex-col gap-4 text-sm" data-task-report>
          {report.done && report.done.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <p className="font-semibold text-foreground">{words.done}</p>
              <ul className="list-disc pl-5 text-muted-foreground">{report.done.map((d) => <li key={d}>{d}</li>)}</ul>
            </section>
          )}
          {report.check && report.check.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <p className="font-semibold text-foreground">{words.check}</p>
              <ol className="list-decimal pl-5 text-muted-foreground">{report.check.map((c) => <li key={c}>{c}</li>)}</ol>
            </section>
          )}
        </div>
      )}
    </AppDialog>
  )
}
