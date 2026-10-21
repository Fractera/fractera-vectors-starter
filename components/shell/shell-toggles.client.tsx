"use client"

import { useEffect, useRef, useState } from "react"
import { FoldHorizontal, Menu, Monitor, Moon, Sun, UnfoldHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "./theme-provider.client"
import { readPref, writePref } from "./shared-prefs"
import { socialIcon } from "./socials"

// ПЕРЕКЛЮЧАТЕЛИ ПОДВАЛА — тема, ширина, соцсети на телефоне. Перенесено из сайта без изменения вида. Выбор
// темы и ширины пишется в cookie проекта (`shared-prefs`, 285-2): сделанный на любой странице — на всех.

export function ThemeToggle({ labels }: { labels: { system: string; light: string; dark: string } }) {
  const { mode, cycleTheme } = useTheme()
  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor
  const label = mode === "light" ? labels.light : mode === "dark" ? labels.dark : labels.system
  return (
    <Button type="button" variant="ghost" size="icon" onClick={cycleTheme} aria-label={label} title={label}>
      <Icon />
    </Button>
  )
}

const WIDTH_KEY = "fractera-app-width"

export function AppWidthToggle({ labels }: { labels: { wide: string; normal: string } }) {
  const [narrow, setNarrow] = useState(false)

  // 🔒 ВЫБОР ПРИМЕНЯЕТСЯ ЗАНОВО ПРИ МОНТИРОВАНИИ, А НЕ ТОЛЬКО СКРИПТОМ ДО ОТРИСОВКИ (285-7, измерено в браузере
  // владельца): на сайте атрибут, поставленный скриптом, пропадал — корень страницы перерисовывался, и ширина
  // возвращалась к обычной при cookie `narrow`. Тема это переживала, потому что провайдер темы применяет её при
  // монтировании; ширина теперь делает то же.
  useEffect(() => {
    const isNarrow = readPref(WIDTH_KEY) === "narrow" // заодно поднимает прежний выбор адреса в cookie проекта
    const el = document.documentElement
    if (isNarrow) el.setAttribute("data-app-width", "narrow")
    else el.removeAttribute("data-app-width")
    setNarrow(isNarrow)
  }, [])

  function toggle() {
    const next = !narrow
    const el = document.documentElement
    if (next) el.setAttribute("data-app-width", "narrow")
    else el.removeAttribute("data-app-width")
    writePref(WIDTH_KEY, next ? "narrow" : "normal")
    setNarrow(next)
  }

  const label = narrow ? labels.wide : labels.normal
  const Icon = narrow ? UnfoldHorizontal : FoldHorizontal
  return (
    <Button type="button" variant="ghost" size="icon" onClick={toggle} aria-label={label} title={label} aria-pressed={narrow} className="hidden md:inline-flex">
      <Icon />
    </Button>
  )
}

export function FooterSocialDropdown({ socials, label }: { socials: { href: string; label: string; icon: string }[]; label: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  if (socials.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <Button variant="bare" size="bare"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        title={label}
        aria-expanded={open}
        className="size-9 inline-flex items-center justify-center rounded-md border border-border text-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {open ? <X size={16} /> : <Menu size={16} />}
      </Button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 min-w-[180px] rounded-xl border border-border bg-popover shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-1 duration-150 py-1">
          {socials.map(({ href, label: name, icon }) => {
            const uploaded = /^(\/|https?:)/.test(icon)
            const Icon = socialIcon(uploaded ? undefined : icon)
            return (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground transition-colors">
                {uploaded ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={icon} alt="" aria-hidden className="size-4 shrink-0" />
                ) : (
                  <Icon className="size-4 shrink-0" />
                )}
                <span>{name}</span>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
