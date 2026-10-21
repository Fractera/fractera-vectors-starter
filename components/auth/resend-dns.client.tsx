"use client"

import { useState } from "react"
import { Lock, Plus, X } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DnsWords } from "@/components/auth/resend-setup.i18n"
import { StepPoints } from "@/components/auth/setup-ladder.client"

// КУДА ВНОСЯТСЯ ЗАПИСИ DNS ДЛЯ RESEND — ДВА АККОРДЕОНА СТУПЕНИ 2 (266-4).
//
// Слово владельца 2026-09-22: «у нас должно быть два аккордеона… один из
// которых будет заблокирован или оба будут заблокированы в зависимости от
// режима». Оба закрыты, пока нет своего домена: этот случай запирает весь экран
// выше, и сюда человек не попадает вовсе.
//
// 🔒 КАКОЙ ОТКРЫТ — РЕШАЕТ ИНДИКАТОР (276-4), а не этот островок: компьютер →
// Cloudflare (записи пишет узел), сервер → регистратор (записи вносит человек).
// Выбор приходит пропом из экрана, а тот берёт его у двери, считающей его одной
// функцией `lib/node-state/auth-mode.ts`. Место не объявлено → закрыты оба.
//
// 🛑 «ОБНУЛИТЬ ЗАПИСИ НА CLOUDFLARE» ПРОЧИТАНО КАК «УБРАТЬ ПУТЬ ЧЕРЕЗ CLOUDFLARE
// С ЭКРАНА», а не как удаление записей в зоне: удаление — деструктивная операция
// над живыми данными человека, и без прямого слова владельца её нет.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
const DOOR = `${BASE}/api/domain/records`

type Row = { type: "TXT" | "CNAME" | "MX"; name: string; content: string; priority: string }
type Result = { name: string; type: string; outcome: "created" | "exists" | "conflict" | "failed"; reason?: string }

// Типы стартовых строк — как в таблице Resend на скриншоте владельца: DKIM,
// две CNAME для отправки, необязательная DMARC. Имена и значения НЕ
// подставляются: у каждого аккаунта они свои, и угаданное имя создало бы в зоне
// запись, которая выглядит верной и не работает.
const START: Row[] = [
  { type: "TXT", name: "", content: "", priority: "" },
  { type: "CNAME", name: "", content: "", priority: "" },
  { type: "CNAME", name: "", content: "", priority: "" },
  { type: "TXT", name: "", content: "", priority: "" },
]
const PLACEHOLDER: Record<Row["type"], { name: string; content: string }> = {
  TXT: { name: "resend._domainkey", content: "p=MIGfMA…" },
  CNAME: { name: "send", content: "….mta.net" },
  MX: { name: "send", content: "feedback-smtp….amazonses.com" },
}

function LockedNote({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-2 text-muted-foreground text-sm">
      <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
      {text}
    </p>
  )
}

export function ResendDns({ words, path }: { words: DnsWords; path: "cloudflare" | "registrar" | null }) {
  const [rows, setRows] = useState<Row[]>(START)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Result[] | null>(null)

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  async function send() {
    const filled = rows.filter((r) => r.name.trim() || r.content.trim())
    if (filled.length === 0 || filled.some((r) => !r.name.trim() || !r.content.trim())) {
      setError(words.errRowIncomplete)
      return
    }
    setBusy(true)
    setError(null)
    setResults(null)
    try {
      const res = await fetch(DOOR, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          records: filled.map((r) => ({
            type: r.type,
            name: r.name.trim(),
            content: r.content.trim(),
            priority: r.type === "MX" && r.priority.trim() ? Number(r.priority) : undefined,
          })),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { results?: Result[]; reason?: string }
      if (data.results) setResults(data.results)
      else if (data.reason === "row-incomplete") setError(words.errRowIncomplete)
      else if (data.reason === "no-cloudflare-zone") setError(words.errNoZone)
      else if (data.reason === "zone-not-visible") setError(words.errZoneNotVisible)
      else setError(`${words.outFailed}${data.reason ? `: ${data.reason}` : ""}`)
    } catch {
      setError(words.outFailed)
    } finally {
      setBusy(false)
    }
  }

  const outcomeText = (r: Result) =>
    r.outcome === "created"
      ? words.outCreated
      : r.outcome === "exists"
        ? words.outExists
        : r.outcome === "conflict"
          ? words.outConflict
          : `${words.outFailed}${r.reason ? `: ${r.reason}` : ""}`

  const cfOpen = path === "cloudflare"
  const regOpen = path === "registrar"

  return (
    <Accordion type="single" collapsible className="mt-3" data-resend-dns defaultValue={cfOpen ? "cf" : regOpen ? "reg" : undefined} key={String(path)}>
      <AccordionItem value="cf" disabled={!cfOpen} data-dns-cf={cfOpen ? "open" : "locked"}>
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2">
            {!cfOpen && <Lock className="size-4 shrink-0" aria-hidden />}
            {words.cfTitle}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-medium text-foreground text-sm">{words.cfAutoTitle}</p>
              <p className="text-muted-foreground text-sm">{words.cfAutoText}</p>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{words.cfManualTitle}</p>
              <p className="text-muted-foreground text-sm">{words.cfManualText}</p>
            </div>
            <div className="flex flex-col gap-2">
              {rows.map((r, i) => (
                // Строки не переупорядочиваются, а удаление сдвигает хвост целиком —
                // индекс здесь законный ключ.
                <div key={i} className="flex flex-col gap-2 rounded-md border border-border p-2 sm:flex-row sm:items-center">
                  <Select value={r.type} onValueChange={(v) => setRow(i, { type: v as Row["type"] })}>
                    <SelectTrigger className="sm:w-28" aria-label={words.colType}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TXT">TXT</SelectItem>
                      <SelectItem value="CNAME">CNAME</SelectItem>
                      <SelectItem value="MX">MX</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    aria-label={words.colName}
                    placeholder={PLACEHOLDER[r.type].name}
                    value={r.name}
                    onChange={(e) => setRow(i, { name: e.target.value })}
                    spellCheck={false}
                    autoComplete="off"
                    className="font-mono text-xs sm:w-44"
                  />
                  <Input
                    aria-label={words.colContent}
                    placeholder={PLACEHOLDER[r.type].content}
                    value={r.content}
                    onChange={(e) => setRow(i, { content: e.target.value })}
                    spellCheck={false}
                    autoComplete="off"
                    className="min-w-0 flex-1 font-mono text-xs"
                  />
                  {r.type === "MX" && (
                    <Input
                      aria-label={words.colPriority}
                      placeholder="10"
                      inputMode="numeric"
                      value={r.priority}
                      onChange={(e) => setRow(i, { priority: e.target.value.replace(/\D/g, "") })}
                      className="font-mono text-xs sm:w-16"
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={words.removeRow}
                    onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                    disabled={rows.length === 1}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRows((prev) => [...prev, { type: "TXT", name: "", content: "", priority: "" }])}
                  disabled={rows.length >= 10}
                >
                  <Plus className="mr-2 size-4" aria-hidden />
                  {words.addRow}
                </Button>
                <Button type="button" onClick={send} disabled={busy}>
                  {busy ? words.sending : words.send}
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-destructive text-sm" role="status">
                {error}
              </p>
            )}
            {results && (
              <ul className="flex flex-col gap-1 text-sm" data-dns-results role="status">
                {results.map((r) => (
                  <li key={`${r.type}-${r.name}`} className={r.outcome === "failed" || r.outcome === "conflict" ? "text-destructive" : "text-foreground"}>
                    <span className="font-mono text-xs">
                      {r.type} {r.name}
                    </span>{" "}
                    — {outcomeText(r)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="reg" disabled={!regOpen} data-dns-reg={regOpen ? "open" : "locked"}>
        <AccordionTrigger className="text-sm">
          <span className="flex items-center gap-2">
            {!regOpen && <Lock className="size-4 shrink-0" aria-hidden />}
            {words.regTitle}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <p className="text-muted-foreground text-sm">{words.regText}</p>
          <StepPoints items={words.regPoints} />
        </AccordionContent>
      </AccordionItem>
      {/* Почему раздел закрыт — видно без раскрытия: запрет без объяснения жесток. */}
      <div className="mt-2">
        <LockedNote text={path === null ? words.placeUnknown : cfOpen ? words.regLocked : words.cfLocked} />
      </div>
    </Accordion>
  )
}
