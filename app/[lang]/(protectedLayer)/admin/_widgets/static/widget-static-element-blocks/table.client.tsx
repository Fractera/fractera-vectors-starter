"use client"

import { useEffect, useState } from "react"
import { Eye } from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ElementBlocksPager, PAGE_SIZES } from "./pager.client"
import type { ElementBlocksUi } from "./ui.i18n"

// ТАБЛИЦА БЛОКОВ ЭЛЕМЕНТА (577-11) — та же логика, что таблица каталога на главной «Блоков» (577-10, владелец: «единая логика»): одна
// строка на запись, длинное режется многоточием, полный текст — подсказкой при наведении и в `title`, Preview — отдельная страница.
// 🔒 577-12 (владелец 2026-10-23: «когда я изменяю количество элементов в таблице это нужно запомнить где-то в локальном хранилище
// браузера … на какой вкладке я находился и прокрутить нужно будет обратно к тому же самому элементу таблицы»): размер страницы, номер
// страницы и строка, у которой нажали Preview, живут в `localStorage` под ключом этой таблицы (`scope`); при возврате таблица открывается
// там же и показывает эту строку. Хранилище недоступно — таблица работает с первой страницы, без ошибки.

export type Row = {
  name: string; section: string; description: string; origin: string; catalogue: boolean; pages: string; previewable: boolean; built: boolean; href: string
}
type Saved = { perPage?: number; page?: number; row?: string }

const KEY = (scope: string) => `element-blocks-table:${scope}`
function load(scope: string): Saved {
  try { return JSON.parse(window.localStorage.getItem(KEY(scope)) ?? "{}") as Saved } catch { return {} }
}
function save(scope: string, patch: Saved) {
  try { window.localStorage.setItem(KEY(scope), JSON.stringify({ ...load(scope), ...patch })) } catch { /* хранилище закрыто */ }
}

function Cut({ text, width = 200 }: { text: string; width?: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span data-block="ebc01" title={text} style={{ maxWidth: width }} className="block truncate">{text}</span>
      </TooltipTrigger>
      <TooltipContent data-block="ebc02" className="max-w-sm">{text}</TooltipContent>
    </Tooltip>
  )
}

export function ElementBlocksTable({ rows, ui, scope, showSection = true }: { rows: Row[]; ui: ElementBlocksUi; scope: string; showSection?: boolean }) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<number>(PAGE_SIZES[0])
  const [mark, setMark] = useState<string | null>(null)

  // Возврат: настройка и строка — из хранилища, затем прокрутка к строке (мгновенно: плавная прокрутка не доводит до места).
  useEffect(() => {
    const s = load(scope)
    const size = PAGE_SIZES.includes(s.perPage as (typeof PAGE_SIZES)[number]) ? (s.perPage as number) : PAGE_SIZES[0]
    const at = s.row ? rows.findIndex((r) => r.name === s.row) : -1
    setPerPage(size)
    setPage(at >= 0 ? Math.floor(at / size) + 1 : Math.max(1, Math.min(s.page ?? 1, Math.ceil(rows.length / size) || 1)))
    if (at >= 0) setMark(s.row ?? null)
  }, [scope, rows])
  useEffect(() => {
    if (!mark) return
    const el = document.querySelector(`[data-row="${CSS.escape(mark)}"]`)
    el?.scrollIntoView({ block: "center", behavior: "instant" })
    const t = setTimeout(() => setMark(null), 1500)
    return () => clearTimeout(t)
  }, [mark, page])

  if (!rows.length) return <EmptyState data-block="s1z4z" title={ui.empty} />
  const pages = Math.max(1, Math.ceil(rows.length / perPage))
  const shown = rows.slice((page - 1) * perPage, page * perPage)
  const go = (p: number) => { const n = Math.min(Math.max(1, p), pages); setPage(n); save(scope, { page: n, row: undefined }) }
  return (
    <TooltipProvider delayDuration={200}>
      <div data-block="fflrc" className="rounded-2xl border border-border">
        <Table data-block="fjys0">
          <TableHeader data-block="ebt01">
            <TableRow data-block="ebt02">
              <TableHead data-block="ebt03">{ui.cols.name}</TableHead>
              <TableHead data-block="ebt04">{ui.cols.preview}</TableHead>
              {showSection && <TableHead data-block="ebt05">{ui.cols.section}</TableHead>}
              <TableHead data-block="ebt06">{ui.cols.description}</TableHead>
              <TableHead data-block="ebt07">{ui.cols.origin}</TableHead>
              <TableHead data-block="ebt08">{ui.cols.pages}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody data-block="ebt09">
            {shown.map((r) => (
              <TableRow
                data-block="ebt10"
                key={r.name}
                data-row={r.name}
                className={`whitespace-nowrap transition-colors ${mark === r.name ? "bg-primary/10" : ""}`}
              >
                <TableCell data-block="ebt11" className="font-mono text-xs">{r.name}</TableCell>
                <TableCell data-block="ebt12">
                  {r.previewable ? (
                    <a
                      href={r.href}
                      onClick={() => save(scope, { row: r.name, page, perPage })}
                      className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                    >
                      <Eye className="size-4" aria-hidden />
                      {ui.open}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{r.built ? ui.noPreview : ui.waitsBuild}</span>
                  )}
                </TableCell>
                {showSection && <TableCell data-block="ebt13"><a href={r.href.slice(0, r.href.lastIndexOf("/"))} className="hover:underline"><Cut text={r.section} width={130} /></a></TableCell>}
                <TableCell data-block="ebt14"><Cut text={r.description || "—"} /></TableCell>
                <TableCell data-block="ebt15">
                  <Badge data-block="kgfpj" variant={r.catalogue ? "default" : "outline"}>{r.origin}</Badge>
                </TableCell>
                <TableCell data-block="ebt16"><Cut text={r.pages} width={160} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ElementBlocksPager
        ui={ui}
        total={rows.length}
        page={page}
        pages={pages}
        perPage={perPage}
        onPage={go}
        onSize={(s) => { setPerPage(s); setPage(1); save(scope, { perPage: s, page: 1, row: undefined }) }}
      />
    </TooltipProvider>
  )
}
