"use client"

import { settingsDoor } from "./settings-door"
import { useMemo, useState } from "react"
import { Loader2, Lock, LockOpen } from "lucide-react"
import { toast } from "./toast"
import { Button, buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { H3, P, Small } from "@/components/ui/typography"
import { AdviceNote } from "./advice-note"
import type { LangRow } from "./languages-editor.client"
import type { SearchLanguagesWords } from "./search-languages.i18n"

// ЯЗЫКИ ДЛЯ ПОИСКОВЫХ СИСТЕМ (шаг 340-3). Людям сайт виден на всех выбранных языках; поисковику — только на открытых.
//
// 🔒 АНГЛИЙСКИЙ И ЯЗЫК ПО УМОЛЧАНИЮ ОТКРЫТЫ ВСЕГДА, И ЗАКРЫТЬ ИХ ЗДЕСЬ НЕЛЬЗЯ (слово владельца 2026-09-30: «отмечены как
// разблокированные, замочек открыт»). Остальные открываются по одному, с подтверждением «под мою ответственность».
// Хранится APP-CONFIG `languages.indexed` — только разблокированные сверх постоянных; узел переносит набор в сборку
// (`NEXT_PUBLIC_INDEXED_LANGUAGES`), а правило, по которому страницы открываются, живёт в `lib/seo/translation-state.ts`.
//
// 🔒 СОХРАНЕНО ≠ ПРИМЕНЕНО — как у набора языков выше: набор запекается при сборке, поэтому рядом всегда стоит строка
// «ждёт развёртывания», сравнивающая сохранённое с собранным.

export function SearchLanguages({
  catalogue,
  supported,
  defaultLang,
  initialUnlocked,
  builtUnlocked,
  deployHref,
  w,
}: {
  catalogue: readonly LangRow[]
  /** Языки сайта (сохранённый набор). */
  supported: readonly string[]
  defaultLang: string
  /** APP-CONFIG `languages.indexed`. */
  initialUnlocked: readonly string[]
  /** С каким набором сайт собран (`NEXT_PUBLIC_INDEXED_LANGUAGES`). */
  builtUnlocked: readonly string[]
  /** 340-4: страница «Развёртывания» ЭТОГО элемента в ядре (Предпросмотр · Принять · Развернуть). */
  deployHref?: string
  w: SearchLanguagesWords
}) {
  const always = useMemo(() => supported.filter((l) => l === "en" || l === defaultLang), [supported, defaultLang])
  const [unlocked, setUnlocked] = useState<string[]>(() => initialUnlocked.filter((l) => supported.includes(l) && !always.includes(l)))
  const [pick, setPick] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const row = (code: string) => catalogue.find((r) => r.code === code)
  const label = (code: string) => {
    const r = row(code)
    return r ? `${r.flag} ${r.nativeName} · ${r.englishName}` : code
  }
  const closed = supported.filter((l) => !always.includes(l) && !unlocked.includes(l))
  const norm = (list: readonly string[]) => list.filter((l) => supported.includes(l) && !always.includes(l)).sort().join(",")
  const pending = norm(unlocked) !== norm(builtUnlocked)

  async function save(next: string[]) {
    setBusy(true)
    try {
      const res = await fetch(settingsDoor(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ languages: { indexed: next } }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
      if (!res.ok || !data.ok) {
        toast.error(w.failed)
        return false
      }
      setUnlocked(next)
      toast.deploy(w.saved)
      return true
    } catch {
      toast.error(w.failed)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function unlock() {
    if (!pick) return
    if (await save([...unlocked, pick])) {
      setPick("")
      setConfirming(false)
    }
  }

  return (
    <section data-block="sl340" data-search-languages className="flex flex-col gap-5">
      <H3 data-block="h60b0" variant="ui">{w.title}</H3>
      <AdviceNote probe="search-languages" tone="recommended" title={w.adviceTitle} text={w.advice} />
      <Small className="max-w-2xl">{w.why}</Small>

      <div data-block="sl34a" className="flex flex-col gap-2">
        <P data-block="k6qjy" className="text-[length:var(--fs-body)] font-medium">{w.openTitle}</P>
        <ul data-block="sl34b" className="flex flex-col gap-2">
          {[...always, ...unlocked].map((code) => (
            <li data-block="sl34c" key={code} data-open-lang={code} className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2">
              <LockOpen className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[length:var(--fs-body)]">{label(code)}</span>
              {always.includes(code) ? (
                <Small>{w.alwaysOpen}</Small>
              ) : (
                <>
                  <Small>{w.unlockedByYou}</Small>
                  <Button type="button" variant="ghost" size="sm" disabled={busy} data-close-lang={code} onClick={() => save(unlocked.filter((l) => l !== code))}>
                    <Lock className="size-4" aria-hidden />
                    {w.close}
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div data-block="sl34d" className="flex flex-col gap-2">
        <P data-block="mtdfv" className="text-[length:var(--fs-body)] font-medium">{w.closedTitle}</P>
        {closed.length === 0 ? (
          <Small>{w.allOpen}</Small>
        ) : (
          <div data-block="sl34e" className="flex flex-wrap items-center gap-3">
            <Select value={pick} onValueChange={(v) => { setPick(v); setConfirming(false) }}>
              <SelectTrigger data-unlock-pick className="h-10 min-w-64">
                <SelectValue placeholder={w.pick} />
              </SelectTrigger>
              <SelectContent>
                {closed.map((code) => (
                  <SelectItem key={code} value={code}>
                    <Lock className="size-3.5" aria-hidden /> {label(code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" disabled={!pick || busy} data-unlock onClick={() => setConfirming(true)} className="h-10">
              <LockOpen className="size-4" aria-hidden />
              {w.unlock}
            </Button>
          </div>
        )}
        {confirming && pick && (
          <div data-block="sl34f" data-unlock-confirm className="flex max-w-2xl flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <P data-block="tj0y9" className="text-[length:var(--fs-body)] font-medium">{w.confirmTitle} {label(pick)}</P>
            <Small className="text-foreground">{w.confirmText}</Small>
            <div data-block="sl34g" className="flex flex-wrap gap-2">
              <Button type="button" disabled={busy} data-unlock-yes onClick={unlock}>
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {w.confirmYes}
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
                {w.cancel}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div data-block="sl34h" data-search-rebuild={pending ? "pending" : "clean"} className="flex flex-col gap-1">
        <P data-block="vednf" className="text-[length:var(--fs-body)] font-medium">{pending ? w.pendingTitle : w.clean}</P>
        {pending && <Small className="max-w-2xl">{w.pending}</Small>}
        {/* 340-4: развёртывание запускает человек на странице элемента в ядре (закон 337) — туда и ведёт кнопка. */}
        {pending && deployHref && (
          <div data-block="sl34i" className="mt-2 flex max-w-2xl flex-col gap-2">
            <Small className="text-foreground">{w.deployNote}</Small>
            <a href={deployHref} data-start-deploy className={buttonVariants({ className: "h-10 w-fit" })}>
              {w.deploy}
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
