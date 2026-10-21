"use client"

import { useEffect, useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"

// «ВЕРНУТЬСЯ» И «УДАЛИТЬ МОЮ УЧЁТНУЮ ЗАПИСЬ» (узел, шаг 331-2).
// Вернуться — туда, откуда человек пришёл на гостевую страницу (корзина, чат): `?from=<путь>` в адресе, иначе путь, который
// замок ветки запомнил до ухода на вход (`sessionStorage` `guest-came-from`), иначе главная. Только путь этого сайта.
// Удалить — после подтверждения: сервер узнаёт гостя сам (`/api/auth/guest-leave`), запись удаляется, куки гаснут, и браузер
// уходит на google.com — сайт человек покидает, как и просил.

export type GuestAccountWords = {
  back: string
  leave: string
  confirm: string
  confirmYes: string
  cancel: string
  leaving: string
  failed: string
  notGuest: string
}

export const CAME_FROM = "guest-came-from"
const LEAVE_TO = "https://www.google.com/"

const localPath = (v: string | null): string | null => (v && v.startsWith("/") && !v.startsWith("//") ? v : null)

export function GuestAccountActions({ lang, words }: { lang: string; words: GuestAccountWords }) {
  const [back, setBack] = useState(`/${lang}`)
  const [state, setState] = useState<"idle" | "confirm" | "leaving" | "failed">("idle")
  // 331-7: страницу видит и вошедший человек (замок пускает любую сессию) — удалять можно только гостя.
  // ✗ Найдено владельцем: архитектор на aifa.dev видел «удалить» и получал отказ двери (она удаляет только гостя).
  const [who, setWho] = useState<"unknown" | "guest" | "member">("unknown")

  useEffect(() => {
    let stored: string | null = null
    try { stored = sessionStorage.getItem(CAME_FROM) } catch { /* хранилище недоступно — главная */ }
    const fromParam = new URLSearchParams(window.location.search).get("from")
    setBack(localPath(fromParam) ?? localPath(stored) ?? `/${lang}`)
    fetch("/api/me", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me: { roles?: string[] } | null) => {
        const roles = me?.roles ?? []
        setWho(roles.length === 1 && roles[0] === "guest" ? "guest" : "member")
      })
      .catch(() => setWho("member"))
  }, [lang])

  async function leave() {
    setState("leaving")
    try {
      const r = await fetch("/api/auth/guest-leave", { method: "POST", credentials: "include", cache: "no-store" })
      if (!r.ok) return setState("failed")
      try { sessionStorage.removeItem(CAME_FROM); sessionStorage.removeItem("guest-login-tried") } catch { /* нечего чистить */ }
      window.location.replace(LEAVE_TO)
    } catch {
      setState("failed")
    }
  }

  if (who === "unknown") return null
  if (who === "member") {
    return (
      <div data-block="cbb8z" className="mt-8 flex flex-col gap-4" data-guest-account="member">
        <p data-block="d00f0" className="text-sm text-muted-foreground">{words.notGuest}</p>
        <div data-block="gcmr4"><a href={back} className={buttonVariants({ variant: "default" })}>{words.back}</a></div>
      </div>
    )
  }
  return (
    <div data-block="txpel" className="mt-8 flex flex-col gap-4" data-guest-account={state}>
      {state === "confirm" ? (
        <div data-block="sx68m" className="flex flex-col gap-3 rounded-lg border border-destructive/40 p-4">
          <p data-block="mgygi" className="text-sm">{words.confirm}</p>
          <div data-block="kc4va" className="flex flex-wrap gap-3">
            <Button variant="destructive" onClick={leave}>{words.confirmYes}</Button>
            <Button variant="outline" onClick={() => setState("idle")}>{words.cancel}</Button>
          </div>
        </div>
      ) : (
        <div data-block="i8xez" className="flex flex-wrap gap-3">
          <a href={back} className={buttonVariants({ variant: "default" })}>{words.back}</a>
          <Button variant="outline" disabled={state === "leaving"} onClick={() => setState("confirm")}>
            {state === "leaving" ? words.leaving : words.leave}
          </Button>
        </div>
      )}
      {state === "failed" && <p data-block="qoy28" className="text-sm text-destructive" role="alert">{words.failed}</p>}
    </div>
  )
}
