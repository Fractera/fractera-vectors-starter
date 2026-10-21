import type { ReactNode } from "react"
import Link from "next/link"
import type { ShellData, ShellSurface } from "./shell-types"
import { isAbsolute } from "./shell-href"
import { DesktopNav, MobileMenu } from "./shell-menu.client"
import { AccountButton } from "./shell-account.client"

// ШАПКА ПРОЕКТА — ОДНА У САЙТА, ВХОДА, ЯДРА И КАЖДОЙ НОВОЙ СЛУЖБЫ (285-3). Вид перенесён из шапки сайта
// (`components/menu/top/top-menu.server.tsx`) без изменений; данные — объект `ShellData`. Имя проекта ведёт в
// корень проекта (`data.home`) с любой поверхности (283-6, слово владельца).
//
// 🔒 КНОПКА КАБИНЕТА ВСЕГДА СПРАВА (владелец, 2026-08-12); настройка стороны решает только, откуда выезжает ящик.
// Ящики слева/справа — только у сайта: вид принимает их кнопки слотами `leftSlot` / `rightSlot`.
export function ProjectHeader({ data, surface = {}, leftSlot, rightSlot }: {
  data: ShellData
  surface?: ShellSurface
  leftSlot?: ReactNode
  rightSlot?: ReactNode
}) {
  const { lang } = data
  const meUrl = surface.meUrl ?? "/api/me"
  const account = data.account ? (
    <AccountButton
      side={data.account.side}
      labels={data.account.labels}
      links={data.account.links}
      meUrl={meUrl}
      loginHref={surface.loginHref ? surface.loginHref(lang) : `/login?lang=${lang}`}
      logoutHref={surface.logoutHref ? surface.logoutHref(lang) : `/logout?lang=${lang}`}
    />
  ) : null

  const groups = data.menuOn ? data.top : []
  const barNeeded = data.menuOn || !!leftSlot || !!rightSlot

  if (!barNeeded) {
    // Меню выключено, вход включён — кнопка живёт сама в верхнем углу (владелец, 2026-08-12).
    if (!account) return null
    return <div className="absolute top-0 right-0 z-40 h-14 px-6 md:px-8 flex items-center">{account}</div>
  }

  const brand = (
    <>
      {data.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.logo} alt="" className="h-7 w-auto object-contain" />
      )}
      <span className="text-sm font-semibold tracking-tight text-foreground">{data.brand}</span>
    </>
  )
  const brandClass = "flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"

  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40" data-project-header>
      <div className="w-full px-6 md:px-8 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {leftSlot}
          {isAbsolute(data.home) ? (
            <a href={data.home} className={brandClass}>{brand}</a>
          ) : (
            <Link href={data.home} className={brandClass}>{brand}</Link>
          )}
          {groups.length > 0 && <DesktopNav lang={lang} groups={groups} meUrl={meUrl} />}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {account}
          {groups.length > 0 && <MobileMenu lang={lang} groups={groups} label={data.words.menu} meUrl={meUrl} />}
          {rightSlot}
        </div>
      </div>
    </header>
  )
}
