"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { DesignWorkbench, DesignPreview } from "./design-workbench"
import { FONT_CATALOGUE, isSystemFont, type FontEntry } from "@/lib/design/font-catalogue"
import type { DesignUi } from "./design.i18n"
import { saveDesign } from "./design-save"

// ВЫБОР ШРИФТОВ ВНУТРИ ПРОЕКТА (39-2, 2026-08-29).
//
// 🔒 ПОВЕДЕНИЕ ПЕРЕНЕСЕНО ИЗ ПАНЕЛИ, А НЕ ПРИДУМАНО ЗАНОВО. Тот же набор ролей,
// та же плитка выбора, та же оговорка о внешних шрифтах. Человек, знавший панель,
// обязан узнать экран; переезд — это смена адреса, а не смена продукта.
//
// 🔒 ОТПРАВЛЯЕТСЯ ВСЯ ВЕТКА `fonts`, И ЭТО НЕ ПРОТИВОРЕЧИТ ЗАКОНУ ЗАПЛАТЫ.
// Заплата защищает СОСЕДНИЕ ветки — `type`, `shape`, `colors`, — и они здесь не
// упоминаются вовсе. Внутри же своей ветки нужен именно снимок: роль, у которой
// выбор сняли, обязана из файла ИСЧЕЗНУТЬ, а слияние по ключам оставило бы ей
// прежнее значение навсегда. Та же причина, по которой массивы меню шлются
// целиком.
//
// 🔒 СИСТЕМНЫЙ ШРИФТ СТОИТ ПЕРВЫМ И НИЧЕГО НЕ ЗАГРУЖАЕТ. Остальные с шага 315
// отдаёт сам узел (`public/fonts/`), и под каждым это написано: наружу страница не
// ходит, без интернета шрифт на месте.

type Role = "heading" | "body" | "mono"
type Choice = { family: string; import?: string }
type State = Partial<Record<Role, Choice>>

const ROLES: Role[] = ["heading", "body", "mono"]

export function DesignFonts({ initial, ui }: { initial: State; ui: DesignUi["fonts"] }) {
  const [state, setState] = useState<State>(initial)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed" | "same">("idle")

  const changed = JSON.stringify(state) !== JSON.stringify(initial)
  // 315: адрес — из КАТАЛОГА по имени, а не из сохранённого `import`: в настройках до 315 там ссылка Google, и
  // предпросмотр тянул бы шрифт оттуда. В каталоге адрес всегда на своём сервере (`/fonts/<slug>.css`).
  const links = [
    ...new Set(
      ROLES.map(r => FONT_CATALOGUE.find(e => e.family === state[r]?.family)?.import).filter((u): u is string => !!u),
    ),
  ]

  function pick(role: Role, entry: FontEntry | null) {
    setStatus("idle")
    setState(prev => ({
      ...prev,
      [role]: entry ? { family: entry.family, ...(entry.import ? { import: entry.import } : {}) } : undefined,
    }))
  }

  async function save() {
    if (!changed) { setStatus("same"); return }
    setStatus("saving")
    try {
      const fonts: Record<string, Choice | null> = {}
      // 310: снятая роль уходит `null` — дверь элемента сливает заплату по ключам.
      for (const r of ROLES) fonts[r] = state[r] ?? null
      const res = await saveDesign({ patch: { fonts } })
      setStatus(res.ok ? "saved" : "failed")
      // 310: дверь элемента сама разослала сигнал — службы перерисуются за секунды, без пересборки.
      if (res.ok) window.dispatchEvent(new CustomEvent("design:saved"))
    } catch {
      setStatus("failed")
    }
  }

  const controls = (
    <div data-block="dive1" className="flex flex-col gap-5">
      {/* Настоящие шрифты в образце: витрина, показывающая выбор чужим шрифтом,
          не показывает ничего. */}
      {links.map(href => <link key={href} rel="stylesheet" href={href} />)}

      <p data-block="pjjcg" className="text-[length:var(--fs-small)] leading-relaxed text-muted-foreground">{ui.intro}</p>

      {ROLES.map(role => {
        const current = state[role]
        const options = FONT_CATALOGUE.filter(f => (role === "mono" ? f.kind === "mono" : f.kind !== "mono"))
        return (
          <section data-block="ip5ft" key={role} data-font-role={role} className="rounded-lg border border-border p-4">
            <p data-block="fnq9w" className="text-[length:var(--fs-body)] font-medium text-foreground">{ui.roles[role].label}</p>
            <p data-block="lnv1i" className="mt-1 text-[length:var(--fs-small)] leading-relaxed text-muted-foreground">
              {ui.roles[role].description}
            </p>

            {/* 🔒 ОДИН СТОЛБЕЦ, А НЕ ДВА (владелец 2026-08-29): «в левой колонке у тебя
                также внутри представлен двухколоночный дизайн… это неправильно,
                представлять здесь карточки везде в один ряд».

                Довод конструктивный: левая колонка сама уже половина верстака, и
                деление её пополам даёт полосы шириной с телефон на настольном
                экране — при том, что справа стоит предпросмотр, ради которого место
                и берегут. */}
            <div data-block="z3ohi" className="mt-3 flex flex-col gap-1.5">
              {options.map(entry => {
                const active = current?.family === entry.family
                const system = isSystemFont(entry.family)
                return (
                  <Button variant="outline"
                    key={entry.family}
                    type="button"
                    onClick={() => pick(role, entry)}
                    aria-pressed={active}
                    className={
                      "h-auto justify-start whitespace-normal font-normal flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left transition-colors " +
                      (active ? "border-primary/50 bg-primary/5" : "border-border hover:bg-muted/50")
                    }
                  >
                    <span
                      className="text-[length:var(--fs-body)] font-medium text-foreground"
                      style={{ fontFamily: entry.family }}
                    >
                      {system ? ui.systemOption : entry.family}
                    </span>
                    <span className="text-[length:var(--fs-small)] leading-relaxed text-muted-foreground">
                      {entry.alphabets.map(a => ui.alphabets[a]).join(", ")}
                      {" · "}
                      {system ? ui.noDownload : ui.external}
                    </span>
                  </Button>
                )
              })}
            </div>

            {current && (
              <Button variant="link"
                type="button"
                onClick={() => pick(role, null)}
                className="mt-2 h-auto p-0 text-[length:var(--fs-small)] font-normal text-muted-foreground"
              >
                {ui.reset}
              </Button>
            )}
          </section>
        )
      })}

      <p data-block="m4vin" className="rounded-md border border-tone-access/30 bg-tone-access/5 p-3 text-[length:var(--fs-small)] leading-relaxed text-tone-access">
        {ui.systemNote}
      </p>

      <div data-block="c16qh" className="flex items-center gap-3">
        <Button variant="default"
          type="button"
          onClick={save}
          disabled={status === "saving"}
        >
          {status === "saving" ? ui.saving : ui.save}
        </Button>
        <span data-save-status={status} className="text-[length:var(--fs-small)] text-muted-foreground">
          {status === "saved" && ui.saved}
          {status === "failed" && ui.failed}
          {status === "same" && ui.nothingToSave}
        </span>
      </div>
    </div>
  )

  // 🔒 ПРЕДПРОСМОТР ПОКАЗЫВАЕТ ТЕКСТ ВЫБРАННЫМИ ШРИФТАМИ, А НЕ ИХ ИМЕНА.
  // Название семейства не отвечает на вопрос, ради которого человек сюда пришёл:
  // как это будет читаться. Отвечает только сам текст, набранный этим шрифтом.
  const preview = (
    <>
      <DesignPreview label={ui.preview}>
        <div data-block="t4grk" data-design-preview="fonts" className="flex flex-col gap-3">
          <p data-block="vnpmu"
            className="text-[length:var(--fs-h3)] font-bold leading-tight text-foreground"
            style={{ fontFamily: state.heading?.family }}
          >
            {ui.previewText}
          </p>
          <p data-block="uj3h6"
            className="text-[length:var(--fs-body)] leading-relaxed text-muted-foreground"
            style={{ fontFamily: state.body?.family }}
          >
            {ui.previewText}
          </p>
          <p data-block="o9hmx"
            className="text-[length:var(--fs-small)] text-muted-foreground"
            style={{ fontFamily: state.mono?.family ?? "ui-monospace, monospace" }}
          >
            {ui.previewText}
          </p>
        </div>
      </DesignPreview>
    </>
  )

  return <DesignWorkbench controls={controls} preview={preview} />
}
