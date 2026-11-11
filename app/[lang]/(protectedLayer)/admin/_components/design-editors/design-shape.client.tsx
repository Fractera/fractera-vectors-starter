"use client"

import { Button } from "@/components/ui/button"
import { PresetField } from "./preset-field.client"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { DesignWorkbench, DesignPreview } from "./design-workbench"
import type { DesignUi } from "./design.i18n"
import { saveDesign } from "./design-save"

// ФОРМЫ И ВОЗДУХ (39-3, 2026-08-29).
//
// 🔒 ЧЕТЫРЕ ЗНАЧЕНИЯ, И КАЖДОЕ ДЕЙСТВУЕТ СРАЗУ НА ВСЕ ПОВЕРХНОСТИ. Скругление
// правится один раз — карточки, панели, кнопки и поля ввода выводят из него свой
// радиус. Дай править каждому элементу отдельно, и интерфейс перестанет быть одним
// интерфейсом: это ровно тот случай, когда свобода настройки покупается потерей
// цельности.
//
// 🔒 ТОЛЩИНА РАМКИ СТОИТ РЯДОМ СО СКРУГЛЕНИЕМ НЕ ПО ТЕХНИКЕ, А ПО СМЫСЛУ: рамка в
// два пикселя меняет характер интерфейса сильнее, чем цвет, — и человек, пришедший
// «сделать помягче», должен видеть оба рычага сразу.
//
// 🔒 ЗНАЧЕНИЯ — СТРОКИ CSS, А НЕ ЧИСЛА. `0.625rem`, `1px`, `80rem`: единица здесь
// часть решения, и отнять её значит запретить половину допустимых форм.

const RADIUS: Record<string, string> = { square: "0rem", soft: "0.375rem", round: "0.625rem", pill: "1.25rem" }
const SPACE: Record<string, number> = { dense: 0.85, normal: 1, airy: 1.2 }

// 711-7: тень карточек и скорость интерфейса — ступенями, как скругление; скорость живёт в своей ветке `motion`.
type Shadow = "none" | "soft" | "medium" | "strong"
type Speed = "none" | "fast" | "normal" | "slow"
type State = { radius?: string; borderWidth?: string; spaceScale?: number; appWidth?: string; shadow?: Shadow; speed?: Speed }
const SHADOWS: Shadow[] = ["none", "soft", "medium", "strong"]
const SPEEDS: Speed[] = ["none", "fast", "normal", "slow"]

export function DesignShape({ initial, ui }: { initial: State; ui: DesignUi["shape"] }) {
  const [state, setState] = useState<State>(initial)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed" | "same">("idle")

  const changed = JSON.stringify(state) !== JSON.stringify(initial)
  const radius = state.radius ?? "0.625rem"
  const border = state.borderWidth ?? "1px"
  const space = state.spaceScale ?? 1
  const width = state.appWidth ?? "80rem"

  function set<K extends keyof State>(key: K, value: State[K]) {
    setStatus("idle")
    setState(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    if (!changed) { setStatus("same"); return }
    setStatus("saving")
    try {
      const patch = {
        shape: {
          radius: state.radius ?? null,
          borderWidth: state.borderWidth ?? null,
          spaceScale: state.spaceScale ?? null,
          appWidth: state.appWidth ?? null,
          shadow: state.shadow ?? null,
        },
        motion: { speed: state.speed ?? null },
      }
      const res = await saveDesign({ patch })
      setStatus(res.ok ? "saved" : "failed")
      // 310: дверь элемента сама разослала сигнал — службы перерисуются за секунды, без пересборки.
      if (res.ok) window.dispatchEvent(new CustomEvent("design:saved"))
    } catch {
      setStatus("failed")
    }
  }

  const controls = (
    <div data-block="kufm6" className="flex flex-col gap-5">
      <p data-block="zesrc" className="text-[length:var(--fs-small)] leading-relaxed text-muted-foreground">{ui.intro}</p>

      <section data-block="bsqc9" data-design-field="radius" className="rounded-lg border border-border p-4">
        <p data-block="sffl9" className="text-[length:var(--fs-body)] font-medium text-foreground">{ui.radiusLabel}</p>
        <p data-block="fhk2e" className="mt-1 text-[length:var(--fs-small)] leading-relaxed text-muted-foreground">{ui.radiusHint}</p>
        <div data-block="bmxvw" className="mt-3 flex flex-col gap-1.5">
          {Object.entries(RADIUS).map(([key, value]) => (
            <Button variant="outline"
              key={key}
              type="button"
              onClick={() => set("radius", value)}
              aria-pressed={radius === value}
              style={{ borderRadius: value }}
              className={
                "h-auto justify-start whitespace-normal font-normal w-full border px-3 py-2 text-left text-[length:var(--fs-small)] transition-colors " +
                (radius === value ? "border-primary/50 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-muted/50")
              }
            >
              {ui.radiusPresets[key as keyof typeof ui.radiusPresets]}
            </Button>
          ))}
        </div>
      </section>

      <section data-block="yiyuq" data-design-field="borderWidth" className="rounded-lg border border-border p-4">
        <p data-block="unewj" className="text-[length:var(--fs-body)] font-medium text-foreground">{ui.borderLabel}</p>
        <p data-block="eb10g" className="mt-1 text-[length:var(--fs-small)] leading-relaxed text-muted-foreground">{ui.borderHint}</p>
        <div data-block="rbfv9" className="mt-3 flex flex-wrap items-center gap-2">
          {["1px", "2px", "3px"].map(value => (
            <Button variant="outline"
              key={value}
              type="button"
              onClick={() => set("borderWidth", value)}
              aria-pressed={border === value}
              style={{ borderWidth: value }}
              className={
                "h-auto justify-start whitespace-normal font-normal rounded-md border px-3 py-1.5 text-[length:var(--fs-small)] transition-colors " +
                (border === value ? "border-primary/50 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-muted/50")
              }
            >
              {value}
            </Button>
          ))}
        </div>
      </section>

      <section data-block="co3i0" data-design-field="spaceScale" className="rounded-lg border border-border p-4">
        <p data-block="atqoc" className="text-[length:var(--fs-body)] font-medium text-foreground">{ui.spaceLabel}</p>
        <p data-block="mptia" className="mt-1 text-[length:var(--fs-small)] leading-relaxed text-muted-foreground">{ui.spaceHint}</p>
        <div data-block="qhhbm" className="mt-3 flex flex-col gap-1.5">
          {Object.entries(SPACE).map(([key, value]) => (
            <Button variant="outline"
              key={key}
              type="button"
              onClick={() => set("spaceScale", value)}
              aria-pressed={space === value}
              className={
                "h-auto justify-start whitespace-normal font-normal w-full rounded-md border px-3 py-2 text-left text-[length:var(--fs-small)] transition-colors " +
                (space === value ? "border-primary/50 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-muted/50")
              }
            >
              {ui.spacePresets[key as keyof typeof ui.spacePresets]}
            </Button>
          ))}
        </div>
      </section>

      <PresetField field="shadow" bids={{ section: "sh7q1", label: "sh7q2", hint: "sh7q3", list: "sh7q4" }} label={ui.shadowLabel} hint={ui.shadowHint}
        options={SHADOWS.map((v) => ({ value: v, label: ui.shadowPresets[v] }))} value={state.shadow ?? "none"} onChange={(v) => set("shadow", v)} />

      <PresetField field="speed" bids={{ section: "mo4k1", label: "mo4k2", hint: "mo4k3", list: "mo4k4" }} label={ui.speedLabel} hint={ui.speedHint}
        options={SPEEDS.map((v) => ({ value: v, label: ui.speedPresets[v] }))} value={state.speed ?? "normal"} onChange={(v) => set("speed", v)} />

      <section data-block="ocxhm" data-design-field="appWidth" className="rounded-lg border border-border p-4">
        <p data-block="t2zed" className="text-[length:var(--fs-body)] font-medium text-foreground">{ui.widthLabel}</p>
        <p data-block="mrsk2" className="mt-1 text-[length:var(--fs-small)] leading-relaxed text-muted-foreground">{ui.widthHint}</p>
        <Input
          type="text"
          value={width}
          onChange={e => set("appWidth", e.target.value)}
          className="mt-3 w-40 rounded-md border border-border bg-background px-2 py-1.5 text-[length:var(--fs-small)]"
        />
      </section>


      <div data-block="b3rgm" className="flex items-center gap-3">
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

  // 🔒 ПРЕДПРОСМОТР СПРАВА И ЛИПНЕТ — та же причина, что у шкалы: четыре рычага
  // формы влияют друг на друга, и увидеть их вместе можно только рядом.
  const preview = (
    <DesignPreview label={ui.preview}>
      <div data-block="wdrsg"
        data-design-preview="shape"
        className="border border-border bg-muted/40"
        style={{ borderRadius: radius, borderWidth: border, padding: `calc(1rem * ${space})` }}
      >
        <p data-block="qkja6" className="text-[length:var(--fs-body)] font-medium text-foreground">{ui.previewCard}</p>
        <p data-block="npt3v" className="mt-1 text-[length:var(--fs-small)] text-muted-foreground">{ui.previewBody}</p>
      </div>
    </DesignPreview>
  )

  return <DesignWorkbench controls={controls} preview={preview} />
}
