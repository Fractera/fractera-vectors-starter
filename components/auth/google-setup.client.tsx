"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Lock, TriangleAlert } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { H3, Small } from "@/components/ui/typography"
import {
  GOOGLE_CONSOLE_URL,
  GOOGLE_LIMITS_URL,
  GOOGLE_VIDEO_URL,
  type GoogleSetupWords,
} from "@/components/auth/google-setup.i18n"
import { CopyRow, LimitsNote, RouteLine, Step, StepPoints } from "@/components/auth/setup-ladder.client"

// ЭКРАН ВКЛЮЧЕНИЯ ВХОДА ЧЕРЕЗ GOOGLE (265-2, переписан 265-4).
//
// ✗ ПЕРВАЯ РЕДАКЦИЯ ПРОВАЛИЛАСЬ НА ЖИВОМ ЧЕЛОВЕКЕ, и это главное, что о ней надо
// знать. Владелец 2026-09-21: «представь что человек никогда в жизни не
// занимался получением этого ключа… из твоего описания я сделать это не могу».
// Экран начинался с адреса возврата — то есть с ПОСЛЕДНЕГО действия, — а путь к
// нему через чужую консоль был свёрнут в одну строку.
//
// 🔒 ОТСЮДА УСТРОЙСТВО: ЛЕСТНИЦА НАЧИНАЕТСЯ ТАМ, ГДЕ ЧЕЛОВЕК СТОИТ, А НЕ ТАМ, ГДЕ
// НАМ УДОБНО ПРИНЯТЬ ДАННЫЕ. Три ступени ведут его по консоли Google (проект →
// что увидят люди → кто может входить), четвёртая отдаёт адреса, пятая принимает
// пару, шестая говорит состояние. Порядок ступеней — это порядок ДЕЙСТВИЙ
// человека, и поле ввода стоит последним не случайно.
//
// 🛑 ЗАМОК ВМЕСТО ФОРМЫ, ПОКА НЕТ СВОЕГО ДОМЕНА — слово владельца того же дня.
// Google возвращает человека по публичному адресу; без домена настройка
// закончилась бы кнопкой, которая выглядит рабочей и не работает. Плашка НЕ
// прячет раздел и называет, куда идти: запрет без двери жесток, и его обходят.
//
// 🛑 СЕКРЕТ ЖИВЁТ В ПОЛЕ РОВНО ДО ОТПРАВКИ. Поля очищаются в ЛЮБОМ исходе:
// значение, оставшееся на экране, видно каждому, кто подойдёт к компьютеру.
// Обратно с сервера секрет не приходит никогда.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
const DOOR = `${BASE}/api/auth/providers/google`

type State = {
  installed: boolean
  /** замок из индикатора (276-4): открыт ли вход и кто вносит записи DNS */
  mode: { open: boolean; dns: "cloudflare" | "registrar" | null }
  clientId: boolean
  clientSecret: boolean
  redirectUri: string | null
  javascriptOrigin: string | null
}

// Ступени и строка копирования — общий модуль `setup-ladder.client.tsx` (266-1).

export function GoogleSetup({ words }: { words: GoogleSetupWords }) {
  const [state, setState] = useState<State | null>(null)
  const [id, setId] = useState("")
  const [secret, setSecret] = useState("")
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    let alive = true
    fetch(DOOR, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: State) => alive && setState(d))
      .catch(() => alive && setState(null))
    return () => {
      alive = false
    }
  }, [])

  /** Перевод причины отказа в человеческие слова. Голый код беды — тот же тупик. */
  const reasonText = (reason: string, status: number): string => {
    if (reason === "both-required") return words.errBoth
    if (reason === "client-id-shape") return words.errShape
    if (reason === "whitespace-in-key") return words.errWhitespace
    if (reason === "temporary-address") return words.errTemporary
    if (reason === "auth-not-installed") return words.notInstalled
    if (status === 401 || status === 403) return words.errForbidden
    return words.errUnknown
  }

  async function send(method: "POST" | "DELETE") {
    if (busy) return
    setBusy(true)
    setAnswer(null)
    try {
      const res = await fetch(DOOR, {
        method,
        headers: method === "POST" ? { "content-type": "application/json" } : undefined,
        body: method === "POST" ? JSON.stringify({ clientId: id.trim(), clientSecret: secret.trim() }) : undefined,
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string } & Partial<State>
      // 🛑 ПОЛЯ ЧИСТЯТСЯ В ЛЮБОМ ИСХОДЕ — см. закон в шапке.
      setId("")
      setSecret("")
      if (data.ok) {
        setState((prev) => ({ ...(prev as State), ...(data as Partial<State>) }))
        setAnswer({ ok: true, text: method === "POST" ? words.savedOn : words.savedOff })
      } else {
        setAnswer({ ok: false, text: reasonText(data.reason ?? "", res.status) })
      }
    } catch {
      setAnswer({ ok: false, text: words.errNetwork })
    } finally {
      setBusy(false)
    }
  }

  if (state === null) return <p className="text-muted-foreground text-sm">{words.loading}</p>

  if (!state.installed) {
    return (
      <p className="my-6 flex items-center gap-2 rounded-lg border border-border border-dashed px-4 py-3 text-muted-foreground text-sm">
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
        {words.notInstalled}
      </p>
    )
  }

  // ЗАМОК: решает индикатор (276-4) — домен измерен и отвечает этим узлом.
  if (!state.mode.open) {
    return (
      <div className="my-6 rounded-lg border border-border border-dashed bg-card p-4" data-google-locked>
        <H3 className="mb-2 flex items-center gap-2" variant="ui">
          <Lock className="size-4 shrink-0" aria-hidden />
          {words.lockedTitle}
        </H3>
        <p className="text-muted-foreground text-sm">{words.lockedText}</p>
        <Small className="mt-2 block text-muted-foreground">{words.lockedWhere}</Small>
      </div>
    )
  }

  const on = state.clientId && state.clientSecret

  return (
    <div className="my-6 flex flex-col gap-3" data-google-setup data-on={on ? "1" : "0"}>
      <p className="text-muted-foreground text-sm">{words.intro}</p>
      <LimitsNote title={words.limitsTitle} text={words.limitsText} more={words.limitsMore} href={GOOGLE_LIMITS_URL} />

      <Step n={1} title={words.step1Title}>
        <p className="text-muted-foreground text-sm">{words.step1Text}</p>
        {/* 🛑 ССЫЛКА, А НЕ КНОПКА-ОБЁРТКА: `Button` этого проекта не умеет `asChild`,
            и подменять её `<button onClick={location.href=…}>` нельзя — такая
            «кнопка» не открывается в новой вкладке, не копируется правой кнопкой и
            не существует для читателя с экранным диктором. Вид даёт
            `buttonVariants`, поведение остаётся ссылочным. */}
        <RouteLine items={words.step1Route} hint={words.routeHint} />
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={GOOGLE_CONSOLE_URL}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonVariants({ variant: "outline" })}
          >
            {words.openConsole}
            <ExternalLink className="ml-2 size-4" aria-hidden />
          </a>
          <a
            href={GOOGLE_VIDEO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonVariants({ variant: "ghost" })}
          >
            {words.watchVideo}
            <ExternalLink className="ml-2 size-4" aria-hidden />
          </a>
        </div>
      </Step>

      <Step n={2} title={words.step2Title}>
        <p className="text-muted-foreground text-sm">{words.step2Text}</p>
        <StepPoints items={words.step2Points} />
      </Step>

      <Step n={3} title={words.step3Title}>
        <p className="text-muted-foreground text-sm">{words.step3Text}</p>
        <StepPoints items={words.step3Points} />
      </Step>

      <Step n={4} title={words.step4Title}>
        <p className="text-muted-foreground text-sm">{words.step4Text}</p>
        {state.redirectUri ? (
          <>
            {/* 🔒 ПОРЯДОК ПОЛЕЙ — ПОРЯДОК ФОРМЫ GOOGLE: сначала origins, под ним
                redirect. Замечание владельца 2026-09-22, пройденное им вживую:
                «у тебя поле для Redirect стоит сверху это неправильно». */}
            {state.javascriptOrigin && (
              <CopyRow
                id="google-origin"
                label={words.originLabel}
                value={state.javascriptOrigin}
                note={words.originOptional}
                copy={words.copy}
                copied={words.copied}
              />
            )}
            <CopyRow
              id="google-redirect"
              label={words.redirectLabel}
              value={state.redirectUri}
              note={words.redirectRequired}
              copy={words.copy}
              copied={words.copied}
            />
          </>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-muted-foreground text-sm">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            {words.noRedirect}
          </p>
        )}
      </Step>

      <Step n={5} title={words.step5Title}>
        <p className="text-muted-foreground text-sm">{words.step5Text}</p>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="google-id">{words.idLabel}</Label>
            <Input
              id="google-id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-xs"
            />
            <Small className="text-muted-foreground">{words.idHint}</Small>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="google-secret">{words.secretLabel}</Label>
            {/* 🔒 `type="password"`: секрет не читается через плечо и не попадает
                в снимок экрана, который человек пришлёт в поддержку. */}
            <Input
              id="google-secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-xs"
            />
            <Small className="text-muted-foreground">{words.secretHint}</Small>
          </div>
          <div>
            <Button type="button" onClick={() => send("POST")} disabled={busy || !id.trim() || !secret.trim()}>
              {busy ? words.sending : words.turnOn}
            </Button>
          </div>
          <Small className="text-muted-foreground">{words.caveat}</Small>
        </div>
      </Step>

      <Step n={6} title={words.step6Title}>
        <p className="text-foreground text-sm" data-google-state={on ? "on" : "off"}>
          {on ? words.onText : words.offText}
        </p>
        {on && (
          <div className="mt-3">
            <Button type="button" variant="outline" onClick={() => send("DELETE")} disabled={busy}>
              {busy ? words.sending : words.turnOff}
            </Button>
          </div>
        )}
      </Step>

      {answer && (
        <p
          className={`rounded-lg border px-4 py-3 text-sm ${answer.ok ? "border-border text-foreground" : "border-destructive/40 text-destructive"}`}
          data-answer={answer.ok ? "ok" : "fail"}
          role="status"
        >
          {answer.text}
        </p>
      )}
    </div>
  )
}
