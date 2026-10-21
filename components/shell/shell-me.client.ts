"use client"

import { useEffect, useState } from "react"

// КТО ВОШЁЛ — ОДИН ЗАПРОС НА СТРАНИЦУ (шаг 285-3). Меню, мобильное меню и кнопка кабинета спрашивали каждый
// сам; теперь ответ один на адрес двери, и все островки оболочки его делят.
export type ShellMe = { userId?: string; email?: string; roles?: string[] } | null

const pending = new Map<string, Promise<ShellMe>>()

function loadMe(url: string): Promise<ShellMe> {
  let p = pending.get(url)
  if (!p) {
    p = fetch(url, { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.userId ? (d as ShellMe) : null))
      .catch(() => null)
    pending.set(url, p)
  }
  return p
}

/** `undefined` — ещё не известно; `null` — гость. */
export function useShellMe(url: string): ShellMe | undefined {
  const [me, setMe] = useState<ShellMe | undefined>(undefined)
  useEffect(() => {
    let alive = true
    loadMe(url).then((m) => { if (alive) setMe(m) })
    return () => { alive = false }
  }, [url])
  return me
}
