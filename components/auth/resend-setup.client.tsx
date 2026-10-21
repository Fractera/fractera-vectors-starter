"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Lock, TriangleAlert } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { H3, Small } from "@/components/ui/typography"
import { RESEND_DOMAINS_URL, RESEND_PRICING_URL, RESEND_URL, type ResendSetupWords } from "@/components/auth/resend-setup.i18n"
import { ResendDns } from "@/components/auth/resend-dns.client"
import { LimitsNote, Step, StepPoints } from "@/components/auth/setup-ladder.client"

// ЭКРАН ВКЛЮЧЕНИЯ ВХОДА ПИСЬМОМ (RESEND) (266-2).
//
// 🔒 ТОТ ЖЕ СМЫСЛ, ЧТО У ЭКРАНА GOOGLE, НА ТЕХ ЖЕ СТУПЕНЯХ. Слово владельца:
// «абсолютно такой же с точки зрения смысла». Лестница начинается там, где
// человек стоит (нет даже аккаунта), а поле ввода стоит последним — порядок
// ступеней есть порядок его действий. Ступени — общий модуль
// `setup-ladder.client.tsx`: собранные врозь, два экрана разошлись бы молча.
//
// 🔒 ЧЕМ ОТЛИЧАЕТСЯ — ТЕМ, ЧЕМ ОТЛИЧАЕТСЯ САМ ПРОВАЙДЕР:
//   · вместо адреса возврата — ДОМЕН и его записи DNS: письмо уходит с вашего
//     домена, и Resend должен в этом убедиться;
//   · значений два, но секрет из них один: отправитель виден и после записи,
//     потому что человек обязан знать, с какого адреса уйдёт письмо.
//
// 🛑 СЕКРЕТ ЖИВЁТ В ПОЛЕ РОВНО ДО ОТПРАВКИ — поле ключа очищается в ЛЮБОМ исходе.
// Отправитель после успеха тоже очищается из поля, но остаётся виден в состоянии.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
const DOOR = `${BASE}/api/auth/providers/resend`

type State = {
  installed: boolean
  /** замок из индикатора (276-4): открыт ли вход и кто вносит записи DNS */
  mode: { open: boolean; dns: "cloudflare" | "registrar" | null }
  zone: string | null
  apiKey: boolean
  from: string | null
}

/** Ссылка в чужую панель — ссылкой, а не кнопкой: открывается в новой вкладке. */
function OutLink({ href, children }: { href: string; children: string }) {
  return (
    <div className="mt-3">
      <a href={href} target="_blank" rel="noreferrer noopener" className={buttonVariants({ variant: "outline" })}>
        {children}
        <ExternalLink className="ml-2 size-4" aria-hidden />
      </a>
    </div>
  )
}

export function ResendSetup({ words }: { words: ResendSetupWords }) {
  const [state, setState] = useState<State | null>(null)
  const [key, setKey] = useState("")
  const [from, setFrom] = useState("")
  const [name, setName] = useState("")
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
    if (reason === "whitespace-in-key") return words.errWhitespace
    if (reason === "from-shape") return words.errFromShape
    if (reason === "from-sandbox") return words.errFromSandbox
    if (reason === "temporary-address") return words.errTemporary
    if (reason === "auth-not-installed") return words.notInstalled
    if (status === 401 || status === 403) return words.errForbidden
    return words.errUnknown
  }

  /**
   * Отправитель для службы. Человек вводит голый адрес и, если хочет, имя;
   * запись «Имя <адрес>» собирает экран. Слово владельца 2026-09-22: «зачем там
   * косые кавычки <> разве не лучше чтобы ты просто показал адрес». Кавычки и
   * угловые скобки из имени убираются — они сломали бы саму запись.
   */
  function sender(): string {
    const address = from.trim()
    const label = name.replace(/[<>"]/g, "").trim()
    return label ? `${label} <${address}>` : address
  }

  async function send(method: "POST" | "DELETE") {
    if (busy) return
    setBusy(true)
    setAnswer(null)
    try {
      const res = await fetch(DOOR, {
        method,
        headers: method === "POST" ? { "content-type": "application/json" } : undefined,
        body: method === "POST" ? JSON.stringify({ apiKey: key.trim(), from: sender() }) : undefined,
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string } & Partial<State>
      // 🛑 КЛЮЧ ЧИСТИТСЯ В ЛЮБОМ ИСХОДЕ. Отправителя оставляем в поле при отказе:
      // он не секрет, и человеку легче поправить опечатку, чем набрать заново.
      setKey("")
      if (data.ok) {
        setFrom("")
        setName("")
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
      <div className="my-6 rounded-lg border border-border border-dashed bg-card p-4" data-resend-locked>
        <H3 className="mb-2 flex items-center gap-2" variant="ui">
          <Lock className="size-4 shrink-0" aria-hidden />
          {words.lockedTitle}
        </H3>
        <p className="text-muted-foreground text-sm">{words.lockedText}</p>
        <Small className="mt-2 block text-muted-foreground">{words.lockedWhere}</Small>
      </div>
    )
  }

  const on = state.apiKey
  const zone = state.zone ?? "example.com"

  return (
    <div className="my-6 flex flex-col gap-3" data-resend-setup data-on={on ? "1" : "0"}>
      <p className="text-muted-foreground text-sm">{words.intro}</p>
      <LimitsNote title={words.limitsTitle} text={words.limitsText} more={words.limitsMore} href={RESEND_PRICING_URL} />

      <Step n={1} title={words.step1Title}>
        <p className="text-muted-foreground text-sm">{words.step1Text}</p>
        <OutLink href={RESEND_URL}>{words.openResend}</OutLink>
      </Step>

      <Step n={2} title={words.step2Title}>
        <p className="text-muted-foreground text-sm">{words.step2Text}</p>
        {state.zone && <p className="mt-2 text-foreground text-sm">{words.zoneHint.replaceAll("{zone}", zone)}</p>}
        <StepPoints items={words.step2Points} />
        <OutLink href={RESEND_DOMAINS_URL}>{words.openDomains}</OutLink>
        <ResendDns words={words.dns} path={state.mode.dns} />
      </Step>

      <Step n={3} title={words.step3Title}>
        <p className="text-muted-foreground text-sm">{words.step3Text}</p>
        <StepPoints items={words.step3Points} />
      </Step>

      <Step n={4} title={words.step4Title}>
        <p className="text-muted-foreground text-sm">{words.step4Text}</p>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="resend-key">{words.keyLabel}</Label>
            {/* 🔒 `type="password"`: ключ не читается через плечо и не попадает
                в снимок экрана, который человек пришлёт в поддержку. */}
            <Input
              id="resend-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-xs"
            />
            <Small className="text-muted-foreground">{words.keyHint}</Small>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="resend-from">{words.fromLabel}</Label>
            <Input
              id="resend-from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder={words.fromExample.replaceAll("{zone}", zone)}
              type="email"
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-xs"
            />
            <Small className="text-muted-foreground">{words.fromHint}</Small>
            <Small className="text-muted-foreground" data-from-examples>
              {words.fromExamples.replaceAll("{zone}", zone)}
            </Small>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="resend-name">{words.nameLabel}</Label>
            <Input
              id="resend-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={words.nameExample}
              autoComplete="off"
            />
            <Small className="text-muted-foreground">{words.nameHint}</Small>
          </div>
          <div>
            <Button type="button" onClick={() => send("POST")} disabled={busy || !key.trim() || !from.trim()}>
              {busy ? words.sending : words.turnOn}
            </Button>
          </div>
          <Small className="text-muted-foreground">{words.caveat}</Small>
        </div>
      </Step>

      <Step n={5} title={words.step5Title}>
        <p className="text-foreground text-sm" data-resend-state={on ? "on" : "off"}>
          {on ? words.onText : words.offText}
        </p>
        {state.from && (
          <p className="mt-1 text-muted-foreground text-sm" data-resend-from>
            {words.fromNow.replace("{from}", state.from)}
          </p>
        )}
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
