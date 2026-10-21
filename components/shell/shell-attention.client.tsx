"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ЧТО ЖДЁТ АРХИТЕКТОРА — ВНУТРИ ЯЩИКА «МОЙ АККАУНТ» ЯДРА (узел, шаг 356-1). Слово владельца 2026-10-01: «перенести её в выдвижной
// ящик мой аккаунт под страницы архитектора … раскрывающиеся список … меню третьего уровня в котором будут перечислены терминалы и
// не кнопка закрыть а кнопка перейти на страницу терминала … аналогичным образом … развёртывания … пульсирующий оранжевый индикатор
// например в четыре пикселя». Заменяет полосу терминалов шага 345.
//
// 🔒 ТОЧКА ИДЁТ ПО ПУТИ: кнопка «Мой аккаунт» → группа страниц архитектора (пока свёрнута) → «Терминалы» / «Развёртывания» (пока
// свёрнуты). Нечего — ни точки, ни списков. Свежесть — открытие страницы, открытие ящика, возврат на вкладку; таймеров нет
// (тот же выбор владельца, что у полосы 345). Закрыть терминал здесь нельзя — только на его странице.
// Источник — дверь ядра `/api/node/attention`; у сайта и других служб адреса нет, и этот код у них не включается.

export type AttentionItem = { id: string; name: string; href: string; commit?: string | null }
export type Attention = { terminals: AttentionItem[]; previews: AttentionItem[] }
export type AttentionWords = { terminals: string; deployments: string; go: string; waiting: string }

/** Опрос двери внимания: при монтировании, по запросу (`refresh`) и при возврате на вкладку. */
export function useAttention(url: string | undefined): { attention: Attention | null; refresh: () => void } {
  const [attention, setAttention] = useState<Attention | null>(null)
  const refresh = useCallback(() => {
    if (!url) return
    fetch(url, { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ({ ok?: boolean } & Partial<Attention>) | null) =>
        setAttention(d?.ok ? { terminals: d.terminals ?? [], previews: d.previews ?? [] } : null))
      .catch(() => setAttention(null))
  }, [url])
  useEffect(() => {
    refresh()
    const onVisible = () => { if (document.visibilityState === "visible") refresh() }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [refresh])
  return { attention, refresh }
}

export const hasAttention = (a: Attention | null) => !!a && a.terminals.length + a.previews.length > 0

/** Оранжевая пульсирующая точка 4 px; `className` ставит её на место. */
export function AttentionDot({ className }: { className?: string }) {
  // Пульс — ореол-маяк (`animate-ping`) вокруг неподвижной точки: мерцание всей точки закреплено за заглушкой загрузки (Skeleton).
  return (
    <span aria-hidden className={cn("pointer-events-none flex size-1", className)} data-attention-dot>
      <span className="absolute inline-flex size-1 rounded-full bg-warning opacity-75 animate-ping motion-reduce:animate-none" />
      <span className="relative inline-flex size-1 rounded-full bg-warning" />
    </span>
  )
}

function Branch({ title, items, words, onGo, kind }: { title: string; items: AttentionItem[]; words: AttentionWords; onGo: () => void; kind: string }) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null
  return (
    <div className="flex flex-col" data-attention-branch={kind}>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="relative w-full justify-start gap-2 pl-6">
        <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} aria-hidden />
        {title} · {items.length}
        {!open && <AttentionDot className="absolute right-2 top-1/2 -translate-y-1/2" />}
      </Button>
      {open && (
        <ul className="flex flex-col gap-0.5 pb-1 pl-10">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-foreground">{it.name}{it.commit ? <span className="ml-1 font-mono text-xs text-muted-foreground">{it.commit}</span> : null}</span>
              <Link href={it.href} onClick={onGo} className={buttonVariants({ variant: "outline", size: "xs" })}>{words.go}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Пункт «Группа страниц архитектора» с раскрытием: «Терминалы» и «Развёртывания», каждый со своим списком. */
export function ArchitectAttention({ href, label, attention, words, onGo }: {
  href: string
  label: string
  attention: Attention
  words: AttentionWords
  onGo: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col" data-architect-attention>
      <div className="flex items-center">
        <Link href={href} onClick={onGo} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "flex-1 justify-start")}>{label}</Link>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={words.waiting} title={words.waiting} className="relative">
          <ChevronDown className={cn("size-4 transition-transform", !open && "-rotate-90")} aria-hidden />
          {!open && <AttentionDot className="absolute right-0.5 top-0.5" />}
        </Button>
      </div>
      {open && (
        <>
          <Branch kind="terminals" title={words.terminals} items={attention.terminals} words={words} onGo={onGo} />
          <Branch kind="deployments" title={words.deployments} items={attention.previews} words={words} onGo={onGo} />
        </>
      )}
    </div>
  )
}
