"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import type { SignInNoticeStrings } from "./sign-in-notice.i18n"

// ПЛАШКА «ВЫ ВОШЛИ» НА САЙТЕ ПОСЛЕ ВОЗВРАТА СО СЛУЖБЫ ВХОДА (260-3).
//
// ✗ Слово владельца 2026-09-21: «у меня раньше при входе всплывала плашка сверху
// вниз зелёная или красная … о моей роли — я этого не увидел». Плашка жила на
// странице входа, а браузер уходил оттуда мгновенно — её не успевали увидеть.
// Теперь она встречает человека там, куда он пришёл.
//
// 🔒 КАК ЭТО ОСТАЁТСЯ СТАТИКОЙ. Страница предрендерена и о входе не знает; прокси
// кладёт в адрес возврата метку `signed-in`, островок видит её в браузере,
// спрашивает `/api/me` и показывает зелёную плашку с ролью или красную, если
// сессия не подтвердилась. Метка тут же убирается из адреса: обновление страницы
// или ссылка, отправленная дальше, плашку не повторят.

export const SIGN_IN_TOASTER = "sign-in"
const MARK = "signed-in"

/** То же правило, что `lib/auth/role-label.ts` службы входа: роль, ради которой
 *  человек пришёл, здесь неизвестна, поэтому — сильнейший тир, затем первая. */
function pickRole(roles: string[]): string {
  return ["architect", "admin"].find((r) => roles.includes(r)) ?? roles[0] ?? "user"
}

const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? `{${k}}`)

export function SignInNotice({ strings }: { strings: SignInNoticeStrings }) {
  useEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has(MARK)) return
    url.searchParams.delete(MARK)
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash)

    fetch("/api/me", { credentials: "same-origin", cache: "no-store" })
      .then(async (r) => {
        const me = r.ok ? ((await r.json()) as { email?: string; roles?: string[] }) : null
        if (me?.email) {
          toast.success(fill(strings.signedIn, { who: me.email, role: pickRole(me.roles ?? []) }), { toasterId: SIGN_IN_TOASTER })
        } else {
          toast.error(strings.failed, { toasterId: SIGN_IN_TOASTER })
        }
      })
      .catch(() => toast.error(strings.failed, { toasterId: SIGN_IN_TOASTER }))
  }, [strings])

  return null
}
