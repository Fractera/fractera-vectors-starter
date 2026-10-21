"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronDown, Menu, X } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { ShellChild, ShellGroup } from "./shell-types"
import { shellHref } from "./shell-href"
import { useShellMe } from "./shell-me.client"

// ВЕРХНЕЕ МЕНЮ ОБОЛОЧКИ — полоса групп (от 780px) и мобильное меню (уже 780px). Перенесено из сайта
// (`components/menu/top/*`, `components/menu/shared/*`) без изменения вида; адреса — через `shellHref`, чтобы
// у служб абсолютные ссылки на сайт не получали второй язык.

export function isPublicGroup(roles: string): boolean {
  return !roles || roles === "public" || roles === "public+guest"
}

/** Группа, закрытая ролью, прячется, пока не известно, кто вошёл: без вспышки «гостевого» меню. */
export function useVisibleGroups(groups: ShellGroup[], meUrl: string): ShellGroup[] {
  const me = useShellMe(meUrl)
  return groups.filter((g) => {
    if (isPublicGroup(g.roles)) return true
    if (me === undefined) return false
    const mine = me?.roles ?? []
    return g.roles.split("+").some((r) => mine.includes(r))
  })
}

function MenuDropdown({ lang, group }: { lang: string; group: ShellGroup }) {
  const groupHref = shellHref(lang, group.href, `/${lang}/${group.slug}`)
  const childHref = (c: ShellChild) => (c.href ? shellHref(lang, c.href, "") : `${groupHref}/${c.slug}`)

  if (group.inert) {
    return (
      <span aria-disabled="true" className={buttonVariants({ variant: "ghost", size: "sm", className: "cursor-default opacity-60 hover:bg-transparent" })}>
        {group.label}
      </span>
    )
  }

  if (!group.childrenAsDropdown || group.children.length === 0) {
    return (
      <Link href={groupHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>
        {group.label}
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          {group.label}
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      {/* Полный текст ссылки без обрезки (владелец, 2026-08-12); ширина ограничена экраном. */}
      <DropdownMenuContent align="start" className="w-[min(22rem,calc(100vw-2rem))] max-h-[600px] overflow-y-auto">
        <DropdownMenuItem asChild>
          <Link href={groupHref} className="font-semibold whitespace-normal break-words leading-snug">
            {group.label}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {group.children.map((c) => (
          <DropdownMenuItem key={c.slug} asChild>
            <Link href={childHref(c)} className="whitespace-normal break-words leading-snug py-1.5">
              {c.title}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DesktopNav({ lang, groups, meUrl }: { lang: string; groups: ShellGroup[]; meUrl: string }) {
  const visible = useVisibleGroups(groups, meUrl)
  if (visible.length === 0) return null
  return (
    <>
      <span className="hidden min-[780px]:block h-5 w-px bg-border" aria-hidden />
      <nav className="hidden min-[780px]:flex items-center gap-3 flex-wrap">
        {visible.map((g) => (
          <MenuDropdown key={g.slug} lang={lang} group={g} />
        ))}
      </nav>
    </>
  )
}

export function MobileMenu({ lang, groups, label, meUrl }: { lang: string; groups: ShellGroup[]; label: string; meUrl: string }) {
  const [open, setOpen] = useState(false)
  const visible = useVisibleGroups(groups, meUrl)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (visible.length === 0) return null

  return (
    <div className="min-[780px]:hidden">
      <Button type="button" variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label={label} aria-expanded={open}>
        {open ? <X /> : <Menu />}
      </Button>

      {open && (
        <>
          {/* Подложка ПОД шапкой, `bg-black/50` — затемнение тёмное в обеих темах. */}
          <div aria-hidden onClick={() => setOpen(false)} className="absolute left-0 right-0 top-14 z-40 h-screen bg-black/50" />
          <nav className="absolute left-0 right-0 top-14 z-50 border-b border-border bg-background shadow-lg">
            <div className="flex flex-col px-6 py-2">
              {visible.map((g) => {
                const groupHref = shellHref(lang, g.href, `/${lang}/${g.slug}`)
                return (
                  <div key={g.slug} className="flex flex-col">
                    {g.inert ? (
                      <span aria-disabled="true" className="py-2.5 text-sm font-semibold text-muted-foreground cursor-default">{g.label}</span>
                    ) : (
                      <Link href={groupHref} onClick={() => setOpen(false)} className="py-2.5 text-sm font-semibold text-foreground hover:text-foreground transition-colors">
                        {g.label}
                      </Link>
                    )}
                    {g.childrenAsDropdown && g.children.map((c) => (
                      <Link
                        key={c.slug}
                        href={c.href ? shellHref(lang, c.href, "") : `${groupHref}/${c.slug}`}
                        onClick={() => setOpen(false)}
                        className="py-2 pl-4 text-sm font-medium text-foreground hover:text-foreground transition-colors whitespace-normal break-words leading-snug"
                      >
                        {c.title}
                      </Link>
                    ))}
                  </div>
                )
              })}
            </div>
          </nav>
        </>
      )}
    </div>
  )
}
