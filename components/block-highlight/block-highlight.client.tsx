"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { BlockHighlightWords } from "./block-highlight.i18n"
import { Button } from "@/components/ui/button"

// ПОДСВЕТКА БЛОКОВ В РЕЖИМЕ АРХИТЕКТОРА (node step 317-3). Образец — FineTuneOverlay сайта 22slots: рамка поверх блока,
// рисуется отдельным слоем `position: fixed` (страница не меняется; портал не нужен — островок и так стоит в конце `<body>`), у рамки — имя блока и «Нажми для обновления» (336-2).
//
// 🔒 ВКЛЮЧАЕТ ЯДРО, А НЕ ПОСЕТИТЕЛЬ. Кнопка «Подсветка» в Preview ядра шлёт в окно просмотра сообщение
// `{ type: "fractera:highlight", on }`; островок слушает только свой источник — https той же зоны или localhost на машине
// узла (то же правило, что `lib/sibling-origin.ts` на сервере). Посетитель сайта подсветку не увидит: его страница не
// открыта в окне ядра, и сообщения ему никто не пошлёт.
// 🔒 АДРЕС = СТРАНИЦА · ФАЙЛ · БЛОК: `data-page` / `data-file` ставит страница ветки (`lib/branch-page.tsx`), `data-block`
// (постоянный `bid`) и `data-kind` — фабрика `page-body` из «Блоков». Блоку ничего знать не нужно. Код виджетов (`<ветка>/_widgets/`)
// получает `data-block` процедурой `npm run widgets:ids` (335) — на каждом контейнере.
// 🔒 АДРЕС УХОДИТ В ЯДРО (336-2): «Нажми для обновления» шлёт `fractera:block` (панель под Preview) и `fractera:update` (окно
// задачи ядра). Скопировать адрес — в окне ядра: в окне чужого источника браузер может закрыть буфер обмена.

type Target = { rect: DOMRect; bid: string; kind: string; page: string; file: string }

const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]"])
// Слово владельца 2026-09-26: «блок подсвечивается на 3 секунды а потом тухнет».
const FLASH_MS = 3000
const FADE_MS = 400

function zoneOf(host: string): string {
  const labels = host.split(".")
  return labels.length > 2 ? labels.slice(1).join(".") : host
}

/** Свой источник: localhost на машине узла или https той же зоны, что и этот сайт. */
function ownOrigin(origin: string): boolean {
  let url: URL
  try { url = new URL(origin) } catch { return false }
  const host = window.location.hostname
  if (LOCAL.has(host)) return LOCAL.has(url.hostname)
  if (url.protocol !== "https:") return false
  const zone = zoneOf(host)
  return url.hostname === zone || url.hostname.endsWith(`.${zone}`)
}

// 324-6: на собственном домене элемента ядро узла — в чужой зоне. Его точный адрес знает сервер элемента; спрашиваем один
// раз и ждём ответа, прежде чем отбросить сообщение (первое сообщение Preview приходит сразу после загрузки окна).
let coreOriginAsked: Promise<string | null> | null = null
function coreOrigin(): Promise<string | null> {
  coreOriginAsked ??= fetch("/api/core-origin", { cache: "no-store" })
    .then((r) => r.json())
    .then((j: { origin?: unknown }) => (typeof j.origin === "string" ? j.origin : null))
    .catch(() => null)
  return coreOriginAsked
}

/** Свой источник или ядро своего узла. */
async function trusted(origin: string): Promise<boolean> {
  return ownOrigin(origin) || origin === (await coreOrigin())
}

/** У обёртки `display: contents` своей коробки нет — рамка обнимает её детей. Адрес на настоящем элементе (виджет на весь
 *  экран ставит его прямо на `h1`, `p`, `li` — 335) — рамка по его собственной коробке: детей-элементов у него может не быть. */
function boxOf(el: Element): DOMRect | null {
  if (getComputedStyle(el).display !== "contents") {
    const own = el.getBoundingClientRect()
    return own.width > 0 && own.height > 0 ? own : null
  }
  const rects = Array.from(el.children).map((c) => c.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0)
  if (rects.length === 0) return null
  const left = Math.min(...rects.map((r) => r.left))
  const top = Math.min(...rects.map((r) => r.top))
  const right = Math.max(...rects.map((r) => r.right))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  return new DOMRect(left, top, right - left, bottom - top)
}

function addressText(t: Target, w: BlockHighlightWords): string {
  return `${w.page}: ${t.page}\n${w.file}: ${t.file}\n${w.block}: ${t.bid} (${t.kind})\n${w.link}: ${blockLink(t.page, t.bid)}`
}

/** Ссылка на блок (318): путь страницы и `#block=<bid>`, без источника — порт узла меняется, его не помнят. Её вставляют
 *  в поле «Найти блок» Preview ядра; её же агент возвращает, закончив правку блока. */
function blockLink(page: string, bid: string): string {
  return `${page}#block=${bid}`
}

/** Первый потомок обёртки `display: contents`, у которого есть коробка: к нему прокручивают. */
function firstBoxed(el: Element): Element | null {
  return Array.from(el.children).find((c) => {
    const r = c.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }) ?? null
}

export function BlockHighlight({ words }: { words: BlockHighlightWords }) {
  const [on, setOn] = useState(false)
  const [target, setTarget] = useState<Target | null>(null)
  const [parent, setParent] = useState<{ source: MessageEventSource; origin: string } | null>(null)
  const [copied, setCopied] = useState(false)
  // Найденный по ссылке блок (318): рамка держится FLASH_MS и гаснет. Живёт отдельно от режима подсветки.
  const [flash, setFlash] = useState<{ el: Element; rect: DOMRect; fading: boolean } | null>(null)
  const flashTimers = useRef<number[]>([])

  // Включение и выключение — только сообщением от своего источника.
  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      const d = e.data as { type?: string; on?: boolean } | null
      if (!d || d.type !== "fractera:highlight" || !e.source || !(await trusted(e.origin))) return
      setOn(Boolean(d.on))
      setParent({ source: e.source, origin: e.origin })
      if (!d.on) setTarget(null)
      ;(e.source as WindowProxy).postMessage({ type: "fractera:highlight-state", on: Boolean(d.on) }, e.origin)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  // Поиск по ссылке (318): `{ type: "fractera:locate", bid }` от своего источника — прокрутить к блоку, обвести на
  // FLASH_MS, погасить, ответить `fractera:locate-state { bid, found }`. Режим подсветки для этого не нужен. Посетитель
  // с `#block=` в адресе ничего не увидит: островок сам адрес не читает, действует только по сообщению ядра.
  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      const d = e.data as { type?: string; bid?: unknown } | null
      if (!d || d.type !== "fractera:locate" || !e.source || !(await trusted(e.origin))) return
      const bid = typeof d.bid === "string" ? d.bid : ""
      const el = bid ? document.querySelector(`[data-block="${CSS.escape(bid)}"]`) : null
      const anchor = el ? firstBoxed(el) : null
      ;(e.source as WindowProxy).postMessage({ type: "fractera:locate-state", bid, found: Boolean(anchor) }, e.origin)
      if (!el || !anchor) return
      // 🛑 Не `scrollIntoView`: он прокручивает и всех родителей, а окно ядра на том же сайте (localhost) браузер
      // прокручивает вместе с нами — поле «Найти блок» уезжало за край экрана (замерено 318-2). Двигаем только свой документ.
      const r = anchor.getBoundingClientRect()
      // Блок выше окна — его начало у верхнего края, а не середина.
      const gap = r.height < window.innerHeight ? (window.innerHeight - r.height) / 2 : 16
      // 🛑 `behavior: "instant"` обязателен: у `<html>` стоит `scroll-smooth`, а плавная прокрутка в браузере владельца
      // не доходит до места — окно оставалось наверху, хотя блок «найден» (замерено 318-2; безголовый Chrome докручивал).
      window.scrollTo({ top: Math.max(0, window.scrollY + r.top - gap), behavior: "instant" })
      for (const t of flashTimers.current) window.clearTimeout(t)
      const rect = boxOf(el)
      if (!rect) return
      setFlash({ el, rect, fading: false })
      flashTimers.current = [
        window.setTimeout(() => setFlash((f) => (f ? { ...f, fading: true } : f)), FLASH_MS),
        window.setTimeout(() => setFlash(null), FLASH_MS + FADE_MS),
      ]
    }
    window.addEventListener("message", onMessage)
    return () => {
      window.removeEventListener("message", onMessage)
      for (const t of flashTimers.current) window.clearTimeout(t)
    }
  }, [])

  // Рамка найденного блока следует за ним при прокрутке и смене размера окна.
  useEffect(() => {
    if (!flash) return
    const el = flash.el
    const onMove = () => {
      const rect = boxOf(el)
      if (rect) setFlash((f) => (f && f.el === el ? { ...f, rect } : f))
    }
    window.addEventListener("scroll", onMove, true)
    window.addEventListener("resize", onMove)
    return () => {
      window.removeEventListener("scroll", onMove, true)
      window.removeEventListener("resize", onMove)
    }
  }, [flash?.el])

  // Наведение: ближайший блок с адресом, рамка по его содержимому.
  useEffect(() => {
    if (!on) return
    let current: Element | null = null
    const measure = (el: Element) => {
      const rect = boxOf(el)
      const pageEl = el.closest("[data-page]")
      if (!rect) return
      setTarget({
        rect,
        bid: el.getAttribute("data-block") ?? "",
        kind: el.getAttribute("data-kind") ?? "",
        page: pageEl?.getAttribute("data-page") ?? window.location.pathname,
        file: pageEl?.getAttribute("data-file") ?? "",
      })
    }
    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null
      if (t?.closest("[data-highlight-ui]")) return
      const el = t?.closest("[data-block]") ?? null
      if (!el || !el.getAttribute("data-block")) return
      current = el
      setCopied(false)
      measure(el)
    }
    const onMove = () => current && measure(current)
    document.addEventListener("mouseover", onOver)
    window.addEventListener("scroll", onMove, true)
    window.addEventListener("resize", onMove)
    return () => {
      document.removeEventListener("mouseover", onOver)
      window.removeEventListener("scroll", onMove, true)
      window.removeEventListener("resize", onMove)
    }
  }, [on])

  // 336-2: «Нажми для обновления» — ядро получает адрес блока (`fractera:block`, панель под Preview) и просьбу открыть окно
  // задачи (`fractera:update`, инструмент ядра `_tools/block-task`). Буфер обмена больше не трогается: адрес покажет и даст
  // скопировать само окно ядра.
  const update = useCallback(() => {
    if (!target || !parent) return
    const msg = { address: addressText(target, words), page: target.page, file: target.file, bid: target.bid, kind: target.kind }
    const win = parent.source as WindowProxy
    win.postMessage({ type: "fractera:block", ...msg }, parent.origin)
    win.postMessage({ type: "fractera:update", ...msg }, parent.origin)
    setCopied(true)
  }, [target, parent, words])

  const flashFrame = flash && (
    <div
      aria-hidden
      data-highlight-flash={flash.fading ? "fading" : "on"}
      className="pointer-events-none fixed rounded-sm border-2 border-primary shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_25%,transparent)] transition-opacity"
      style={{
        top: flash.rect.top - 2, left: flash.rect.left - 2, width: flash.rect.width + 4, height: flash.rect.height + 4,
        zIndex: 2147483000, opacity: flash.fading ? 0 : 1, transitionDuration: `${FADE_MS}ms`,
      }}
    />
  )

  if (!on || !target) return flashFrame ? <div data-highlight-ui>{flashFrame}</div> : null
  const { rect } = target
  return (
    <div data-highlight-ui>
      {flashFrame}
      <div
        aria-hidden
        className="pointer-events-none fixed rounded-sm border-2 border-primary"
        style={{ top: rect.top - 2, left: rect.left - 2, width: rect.width + 4, height: rect.height + 4, zIndex: 2147483000 }}
      />
      <div
        className="fixed flex items-center gap-2 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground shadow"
        style={{ top: Math.max(4, rect.top - 30), left: Math.max(4, rect.left), zIndex: 2147483001 }}
      >
        <span className="font-mono">{target.kind} · {target.bid}</span>
        <Button variant="bare" size="bare" type="button" onClick={update} className="rounded bg-primary-foreground/15 px-1.5 py-0.5 hover:bg-primary-foreground/25" data-highlight-update>
          {copied ? words.sent : words.update}
        </Button>
      </div>
    </div>
  )
}
