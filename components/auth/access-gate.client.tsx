"use client"

// AccessGate — the one door of the protected layer.
//
// 🔒 WHAT THIS IS AND IS NOT. This is HONEST SIGNAGE, not a lock. A check that
// runs in the browser can be switched off in the browser. The lock is the
// server: every `/api/*` route that returns protected data re-checks the
// session and the role, and refuses without one. If you ever find a page whose
// data is safe only because this component rendered, the data route is broken —
// fix it there, not here.
//
// 🔒 WHY IT IS AN ISLAND AND NOT A LAYOUT CHECK. Reading the session in a
// layout (`auth()`, `cookies()`, `headers()`) turns the entire subtree dynamic
// in one line, and the protected layer is built on a prerendered shell. So the
// shell renders instantly for everyone, and this island answers "may I?" after
// hydration. The visitor sees the frame of the page immediately and the verdict
// a moment later — instead of a blank wait for an answer they usually get.
//
// The dialog is deliberately a DIALOG and not a toast. Three actions do not fit
// legibly in a toast, and a person who cannot open a page needs a decision, not
// a notification that slides away while they read it.

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppDialog } from "@/components/dialog/app-dialog.client"
import type { AppDialogUi } from "@/components/dialog/app-dialog.i18n"
import { signInRedirectUrl } from "@/lib/runtime-urls"
import { isTemporaryHostname } from "@/lib/auth/temporary-address"
import { isLoopbackHostname } from "@/lib/auth/owner-at-machine"
import { isShowcaseHostname } from "@/lib/showcase"
import type { AccessGateUi } from "./access-gate.i18n"

// 🔒 «НЕ СМОГ СПРОСИТЬ» — ЭТО НЕ «ОТКАЗАНО» (2026-09-19). Четвёртое значение
// заведено потому, что трёх не хватало: сеть молчит · сервер ещё поднимается
// после включения компьютера · страницу отдал service worker из кеша, а туннель
// мёртв. Во всех трёх случаях вопрос НЕ ЗАДАН — а человек видел окно «Требуется
// одна из этих ролей: architect».
//
// ✗ ОПЛАЧЕНО ЧЕТЫРЬМЯ ЖАЛОБАМИ ВЛАДЕЛЬЦА ПОДРЯД, и каждый раз чинили не то:
// правило открытого адреса на сервере было верным и работало, а врал прибор в
// браузере — `catch` записывал сетевой отказ в отказ по правам. Прибор,
// печатающий отказ там, где он ничего не измерил, лжёт именно тогда, когда на
// него полагаются.
type Verdict = "checking" | "allowed" | "denied" | "unknown"

/**
 * Адрес, на котором слой открыт по решению владельца: сама машина, временный
 * туннель и **витрина Fractera**.
 *
 * 🔒 ПРИЗНАКИ — ТЕ ЖЕ ФУНКЦИИ, ЧТО ЧИТАЕТ СЕРВЕР (`lib/auth/*`, `lib/showcase`),
 * а не вторая их копия: две половины одного знания расходятся молча, и здесь
 * расхождение выглядит как запертая дверь у себя дома.
 *
 * 🛑 ТРИ ПРИЗНАКА СВЕРЯЮТ РАЗНОЕ, И ЭТО НЕ НЕБРЕЖНОСТЬ. У туннеля сверяется ХВОСТ
 * имени: оно случайно и меняется при каждом перезапуске. У витрины — имя ЦЕЛИКОМ:
 * совпадение по хвосту открыло бы режим любому поддомену, включая тот, что
 * однажды заведёт себе чужой человек.
 *
 * 🔒 ОДНА ЭТА ФУНКЦИЯ ОТКРЫВАЕТ И СЛОЙ АРХИТЕКТОРА, И ЧЕТЫРЕ ПРИВАТНЫЕ ГРУППЫ —
 * потому что замок у них общий (`AccessGate` стоит в макете каждой). Решение
 * владельца 2026-09-20: «проиндексируем слой архитектора и одновременно
 * индексируемый слой приватных страниц… только у Fractera».
 */
function isOpenAddress(hostname: string): boolean {
  return isLoopbackHostname(hostname) || isTemporaryHostname(hostname) || isShowcaseHostname(hostname)
}

export function AccessGate(
  { roles, lang, ui, dialogUi, children, homeHref }:
  {
    roles: readonly string[]
    lang: string
    ui: AccessGateUi
    /** Слова общего окна — резолвятся на сервере (`appDialogUi(lang)`). */
    dialogUi: AppDialogUi
    children: React.ReactNode
    /**
     * Куда ведёт «На главную» (294). По умолчанию `/<язык>` этого адреса — верно у сайта. У ядра главная сама под
     * замком: ✗ владелец 2026-09-24 — «перебрасывает снова на этот же сайт … бесконечный цикл». Ядро передаёт корень
     * ПРОЕКТА (сайт).
     */
    homeHref?: string
  },
) {
  const router = useRouter()
  const home = homeHref ?? `/${lang}`
  const goHome = () => (/^https?:\/\//.test(home) ? window.location.assign(home) : router.push(home))
  const t = ui
  const [verdict, setVerdict] = useState<Verdict>("checking")

  useEffect(() => {
    // 🔒 ОТКРЫТЫЙ АДРЕС ОТВЕЧАЕТ РАНЬШЕ ВОПРОСА, И ЭТО НЕ УСКОРЕНИЕ, А ПОЧИНКА.
    // Сервер на этих адресах и так выдаёт роль архитектора; спрашивая его, окно
    // ставило себя в зависимость от сети — а на домашней машине сеть отваливается
    // ровно тогда, когда человек включает компьютер и открывает вкладку раньше,
    // чем поднялся сервер.
    if (isOpenAddress(window.location.hostname)) { setVerdict("allowed"); return }

    let alive = true
    fetch("/api/me")
      .then(async res => {
        if (!alive) return
        // Дверь ОТВЕТИЛА «нельзя» — это единственный честный отказ.
        if (res.status === 401 || res.status === 403) { setVerdict("denied"); return }
        // Любой другой неуспех (500, 502, страница вместо JSON) — не ответ о
        // правах, а поломка на пути к двери.
        if (!res.ok) { setVerdict("unknown"); return }
        const me = (await res.json()) as { roles?: string[] } | null
        if (!alive) return
        const mine = me?.roles ?? []
        setVerdict(mine.some(r => roles.includes(r)) ? "allowed" : "denied")
      })
      // Сеть не дала спросить. Молчим: замок всё равно серверный, а окно с
      // отказом здесь было бы уверенным неверным ответом.
      .catch(() => { if (alive) setVerdict("unknown") })
    return () => { alive = false }
  }, [roles])

  // Пока идёт проверка, содержимое УЖЕ на экране: каркас статический и ничьих
  // данных не несёт. Прятать его на время вопроса значит показывать пустоту там,
  // где нечего скрывать.
  if (verdict !== "denied") return <>{children}</>

  return (
    <>
      {children}
      {/* 🔒 `dismissible={false}` — ЗАКРЫТЬ ЭТО ОКНО НЕЛЬЗЯ, и это его смысл:
          закрытие оставило бы человека на странице, которую ему нельзя видеть.
          Раньше запрет держался одной строкой `onEscapeKeyDown` — а крестик при
          этом РИСОВАЛСЯ и не работал, потому что окно было открыто наглухо.
          Кнопка, которая видима и ничего не делает, хуже её отсутствия; теперь
          её просто нет, и все три пути закрытия перекрыты разом. */}
      <AppDialog
        open
        onOpenChange={() => {}}
        dismissible={false}
        size="sm"
        ui={dialogUi}
        titleClassName="flex items-center gap-2 text-destructive"
        title={<><ShieldAlert size={16} /> {t.title}</>}
      >
        <div className="flex flex-col gap-2">
          {/* Роли названы поимённо. «Недостаточно прав» без перечня — тупик:
              человек не знает, чего просить и у кого. */}
          <p className="text-sm text-muted-foreground">
            {t.needRoles.replace("{roles}", roles.join(", "))}
          </p>
          <p className="text-sm text-muted-foreground">{t.haveAccess}</p>
          <p className="text-sm text-muted-foreground">{t.wrongPlace}</p>

          {/* Кнопки стоят СТОЛБИКОМ и в теле, а не в подвале окна: подвал
              выкладывает их в строку с обратным порядком на узком экране, и
              «отмена» оказалась бы первой из трёх. Порядок здесь смысловой —
              сначала то, ради чего человек пришёл. */}
          <div className="mt-2 flex flex-col gap-2">
            {/* Адрес возврата — ЭТА страница: после входа человек оказывается
                там, куда шёл, а не на чужой стартовой. */}
            <Button
              // 285: вход просит ту роль, которую требует страница — иначе человек с ролью `user` входит и снова
              // упирается в этот же замок, не узнав, чего ему не хватает.
              onClick={() => { window.location.href = signInRedirectUrl(window.location.href, roles.includes("architect") ? "architect" : "user") }}
            >
              {t.signIn}
            </Button>
            <Button variant="outline" onClick={() => goHome()}>
              {t.goHome}
            </Button>
            {/* «Отмена» = назад. По прямой ссылке истории нет — тогда это тот же
                корень, потому что кнопка, которая ничего не делает, хуже её
                отсутствия. */}
            <Button
              variant="ghost"
              onClick={() => {
                if (window.history.length > 1) router.back()
                else goHome()
              }}
            >
              {t.cancel}
            </Button>
          </div>
        </div>
      </AppDialog>
    </>
  )
}

/** Полоска ожидания для страниц, которым нужно показать, что проверка идёт. */
export function AccessChecking({ ui }: { ui: AccessGateUi }) {
  const t = ui
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Loader2 size={12} className="animate-spin" /> {t.checking}
    </span>
  )
}

