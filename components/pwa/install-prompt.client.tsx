'use client'

// Предложение установить приложение (шаг 504).
//
// ЗАЧЕМ ОНО НУЖНО. Браузер умеет предлагать установку сам, но прячет это в меню
// и в значке адресной строки — то есть находит его тот, кто и так знал, что
// искать. Посетитель, которому приложение было бы полезно, о такой возможности
// не узнаёт никогда.
//
// 🔒 МЫ НЕ ПОКАЗЫВАЕМ НИЧЕГО, ПОКА БРАУЗЕР НЕ РАЗРЕШИЛ. Кнопка появляется только
// после события `beforeinstallprompt`: браузер присылает его, лишь когда сайт
// действительно устанавливаем (манифест с иконками, https, воркер) и посетитель
// уже проявил интерес. Своё «поставьте наше приложение», нарисованное без этого
// события, оказывается либо неработающим (ставить нечем — окно вызывается только
// из этого события), либо назойливым.
//
// 🔒 ОТКАЗ ПОМНИТСЯ. Нажал «Не сейчас» — предложение не возвращается тридцать
// дней. Баннер, который приходит на каждой странице, — причина, по которой люди
// перестают читать вообще все баннеры сайта, включая согласие на cookie.
//
// Слова приезжают ПРОПСОМ с сервера: 82 языка живут в
// `install-prompt.i18n.ts`, и островок их не импортирует — иначе весь словарь
// уехал бы в браузер на каждой странице.

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import type { InstallStrings } from './install-prompt.i18n'
import { readStored, writeStored } from '@/lib/safe-storage'
import { isTemporaryHostname } from '@/lib/auth/temporary-address'
import { isLoopbackHostname } from '@/lib/auth/owner-at-machine'
import { Button } from "@/components/ui/button"

// Событие нестандартное: в типах TypeScript его нет, потому что в спецификации
// оно не описано — это дополнение поставщиков браузеров. Объявляем ровно то, чем
// пользуемся.
type InstallEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const SNOOZE_KEY = 'fractera-install-dismissed'
const SNOOZE_DAYS = 30

// 🔒 НА ВРЕМЕННОМ АДРЕСЕ ПРЕДЛОЖЕНИЕ НЕ ПОКАЗЫВАЕТСЯ — решение владельца
// 2026-09-19: «Кнопка установить приложение не должна показываться в режиме с
// временным доменом».
//
// 🛑 ДОВОД ТЕХНИЧЕСКИЙ, А НЕ ВКУСОВОЙ. Установленное приложение запоминает адрес,
// с которого его поставили. Адрес быстрого туннеля живёт часы и при перезапуске
// меняется навсегда — значит поставленный с него значок назавтра открывает
// страницу Cloudflare с ошибкой 1016. Человек получает сломанное приложение на
// рабочем столе и ни одного способа понять почему.
//
// 🔒 ПРИЗНАК БЕРЁТСЯ ИЗ ТОГО ЖЕ ФАЙЛА, ЧТО У ВОРОТ СЛОЯ, А НЕ ПОВТОРЯЕТСЯ ЗДЕСЬ
// СТРОКОЙ (2026-09-19). Была своя копия суффикса — две половины одного знания,
// расходящиеся молча: день, когда Cloudflare сменит домен, сломал бы ворота и
// баннер по-разному. Спрашивается он всё равно в браузере: островок и так
// клиентский, а страница обязана остаться статической.

// 🔒 ПРЕДЛОЖЕНИЕ МОЛЧИТ В РАЗРАБОТКЕ И НА ЗАКРЫТЫХ СТРАНИЦАХ — решение
// владельца 2026-09-19: «pwa banner not need show in the dev mod and protected
// flow».
//
// 🛑 ДОВОД У КАЖДОГО СЛУЧАЯ СВОЙ. В разработке приложение ставилось бы с адреса
// локальной машины, который назавтра занят другим проектом. А слой архитектора и
// приватные страницы — это РАБОТА, а не витрина: предлагать поставить значок
// поверх настроек сервера значит мешать человеку ровно в ту минуту, когда он
// сосредоточен.
//
// 🔒 ПРОВЕРЯЕМ АДРЕС, А НЕ РОЛЬ. Роль островку неизвестна без запроса к двери, а
// запрос ради баннера — лишний поход в сеть на каждой странице. Адрес же говорит
// всё: слой архитектора и панель закрыты по устройству, и путь это называет.
// 314-2: ветки защищённого и гостевого слоя шаблона элемента.
const PROTECTED_PATHS = ['/architect', '/dashboard', '/account', '/staff', '/finance', '/admin', '/guest']

function onProtectedPage(): boolean {
  if (typeof window === 'undefined') return false
  const p = window.location.pathname
  return PROTECTED_PATHS.some(seg => p.includes(seg))
}

// 🛑 ЭТОТ ПРИЗНАК НА ДОМАШНЕЙ МАШИНЕ НЕ СРАБАТЫВАЕТ НИКОГДА, И ЭТО ИЗМЕРЕНО, А НЕ
// предположено (2026-09-19, `logs/runtime.json`: `"mode": "production"`). Домашний
// узел работает в ПРОДАКШНЕ по решению владельца 2026-09-18 — значит `NODE_ENV`
// здесь всегда `production`, и проверка «идёт ли разработка» была мёртвой строкой,
// пока владелец четырежды сообщал, что баннер всплывает. Оставлена ради `npm run
// dev`; работу делает признак адреса ниже.
function inDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production'
}

// 🔒 АДРЕС, С КОТОРОГО ПРИЛОЖЕНИЕ СТАВИТЬ НЕЛЬЗЯ: сама машина и временный туннель.
//
// 🛑 ДОВОД ОДИН И ТОТ ЖЕ У ОБОИХ, И ОН ТЕХНИЧЕСКИЙ. Установленное приложение
// НАВСЕГДА запоминает адрес, с которого его поставили. `localhost:24680` завтра
// занят другим проектом или сервер выключен; имя быстрого туннеля живёт часы и при
// перезапуске меняется — значок на рабочем столе открывает ошибку 1016. Человек
// получает сломанное приложение и ни одного способа понять почему.
//
// Предлагать установку можно только с ПОСТОЯННОГО собственного адреса человека.
function onAddressWithoutFuture(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return isLoopbackHostname(host) || isTemporaryHostname(host)
}

function snoozed(): boolean {
  try {
    const raw = readStored(SNOOZE_KEY)
    if (!raw) return false
    return Date.now() - Number(raw) < SNOOZE_DAYS * 24 * 60 * 60 * 1000
  } catch {
    // Приватный режим запрещает хранилище — тогда просто не помним отказ.
    return false
  }
}

export function InstallPrompt({ strings }: { strings: InstallStrings }) {
  const [event, setEvent] = useState<InstallEvent | null>(null)

  useEffect(() => {
    if (inDevelopment()) return
    if (onProtectedPage()) return
    if (onAddressWithoutFuture()) return
    if (snoozed()) return

    const onPrompt = (e: Event) => {
      // Отменяем показ СВОЕЙ полосы браузера, чтобы предложение было одно, а не
      // два разных в одном окне.
      e.preventDefault()
      setEvent(e as InstallEvent)
    }
    // Приложение уже установили из браузера — предлагать нечего.
    const onInstalled = () => setEvent(null)

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!event) return null

  const dismiss = () => {
    // без хранилища отказ живёт до перезагрузки — это лучше, чем ничего
    writeStored(SNOOZE_KEY, String(Date.now()))
    setEvent(null)
  }

  const install = async () => {
    // Окно установки открывает БРАУЗЕР, и только по этому событию. Второй раз то
    // же событие использовать нельзя, поэтому кнопка исчезает сразу.
    setEvent(null)
    try {
      await event.prompt()
      const choice = await event.userChoice
      // Отказался в окне браузера — считаем это отказом и не спрашиваем месяц.
      if (choice.outcome === 'dismissed') {
        writeStored(SNOOZE_KEY, String(Date.now()))
      }
    } catch {
      /* окно не открылось — молча, это не поломка сайта */
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
      <Button variant="bare" size="bare"
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Download size={14} className="shrink-0" />
        {strings.install}
      </Button>
      <Button variant="bare" size="bare"
        type="button"
        onClick={dismiss}
        title={strings.dismiss}
        aria-label={strings.dismiss}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X size={14} />
      </Button>
    </div>
  )
}
