"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { LogIn, LogOut, User } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ShellLink, ShellSide } from "./shell-types"
import { useShellMe } from "./shell-me.client"
import { isTemporaryHostname } from "./temporary-host"

// ВХОД И КАБИНЕТ ОБОЛОЧКИ. Перенесено из сайта (`components/menu/account/*`) без изменения вида. Двери входа
// (`meUrl`, `loginHref`, `logoutHref`) — свои у каждой поверхности: у сайта и ядра `/api/me`, `/login`,
// `/logout` (их прокси ведёт на службу входа), у самой службы входа — её собственные адреса.
//
// 🔒 `prefetch={false}` на всех адресах входа: Next заранее тянет страницы по видимым ссылкам, а `/login` и
// `/logout` уводят на другой домен — ошибка CORS в консоли на каждой странице (найдено владельцем 2026-08-13).

type Labels = { signIn: string; account: string; signOut: string }

function AccountDrawer({ side, labels, email, roles = [], links, logoutHref }: {
  side: ShellSide
  labels: Labels
  email?: string
  roles?: string[]
  links: ShellLink[]
  logoutHref: string
}) {
  const [open, setOpen] = useState(false)
  // Пункт со списком ролей виден только тому, у кого есть хоть одна из них; замок — на самой странице.
  const items = links.filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)))

  return (
    <>
      {/* md и уже — только значок (278); подпись остаётся доступным именем на любой ширине. */}
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={labels.account} title={labels.account}>
        <User /><span className="hidden lg:inline">{labels.account}</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={side} className="w-80 sm:max-w-sm p-0 gap-0 flex flex-col">
          <SheetHeader className="border-b border-border">
            <SheetTitle>{labels.account}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {items.length > 0 && (
              <nav className="flex flex-col gap-0.5">
                {items.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full justify-start")}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="mt-auto border-t border-border p-3 flex flex-col gap-3">
            {roles.length > 0 && (
              <div className="hide-scrollbar flex gap-1.5 overflow-x-auto">
                {roles.map((r) => (
                  <Badge key={r} variant="secondary" className="shrink-0">{r}</Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-foreground truncate">{email}</span>
            </div>
            <Separator />
            <Link href={logoutHref} prefetch={false} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full justify-start")}>
              <LogOut />{labels.signOut}
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function AccountButton({ side, labels, links, meUrl, loginHref, logoutHref }: {
  side: ShellSide
  labels: Labels
  links: ShellLink[]
  meUrl: string
  loginHref: string
  logoutHref: string
}) {
  const me = useShellMe(meUrl)

  // На временном публичном адресе кнопки входа нет: `/login` там отвечает честным 404 (257-8).
  const [temporaryHost, setTemporaryHost] = useState(false)
  useEffect(() => {
    setTemporaryHost(isTemporaryHostname(window.location.hostname))
  }, [])

  if (temporaryHost && !(me && me.userId)) return null
  if (me && me.userId) {
    return <AccountDrawer side={side} labels={labels} email={me.email} roles={me.roles} links={links} logoutHref={logoutHref} />
  }
  return (
    // 293: как у «Личного кабинета» (278) — на md и уже только значок, подпись с lg; остаётся доступным именем.
    // Слово владельца 2026-09-24: «ты кнопку мой аккаунт сделал для этой логики а кнопку войти не сделал».
    <Link href={loginHref} prefetch={false} aria-label={labels.signIn} title={labels.signIn} className={buttonVariants({ variant: "ghost", size: "sm" })}>
      <LogIn /><span className="hidden lg:inline">{labels.signIn}</span>
    </Link>
  )
}
