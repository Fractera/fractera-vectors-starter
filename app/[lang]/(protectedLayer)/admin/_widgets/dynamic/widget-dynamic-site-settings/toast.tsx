'use client'

// СООБЩЕНИЯ РЕДАКТОРОВ НАСТРОЕК (шаг 299-5; 425 — на sonner). Редакторы зовут `toast.success/error/info/deploy`; показывает
// их тостер элемента `sonner` (один на страницу, в макете `[lang]`) — своего тоста у виджета больше нет (владелец 2026-10-07:
// «ничего самописного»).
//
// 🔒 ТОСТ ВЫЕЗЖАЕТ СВЕРХУ ПО ЦЕНТРУ — тем же тостером, что тост входа (слово владельца 2026-09-25: «когда мы входим в
// авторизацию, нам опускается сверху вниз тост … тут точно также»). Два рода:
//   · обычный — изменение принято;
//   · `deploy` — изменение вступит в силу только после развёртывания проекта: в тосте кнопка на дашборд развёртываний
//     ядра (адрес даёт макет из ARCHITECT_URL), и он живёт, пока его не закроют.
import { useEffect } from 'react'
import { toast as sonner } from 'sonner'
import { SIGN_IN_TOASTER } from '@/components/auth/sign-in-notice.client'

type Kind = 'success' | 'error' | 'info' | 'deploy'
type Message = { kind: Kind; text: string }
const EVENT = 'settings-toast'

function emit(kind: Kind, text: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<Message>(EVENT, { detail: { kind, text } }))
}

export const toast = {
  success: (text: string) => emit('success', text),
  error: (text: string) => emit('error', text),
  info: (text: string) => emit('info', text),
  message: (text: string) => emit('info', text),
  /** Вступит в силу после развёртывания — тост с кнопкой на дашборд развёртываний. */
  deploy: (text: string) => emit('deploy', text),
}

/** Мост к тостеру элемента: слова и адрес кнопки развёртывания приходят от сервера, разметки у моста нет. */
export function SettingsToaster({ deployHref, deployLabel, closeLabel }: { deployHref?: string; deployLabel: string; closeLabel: string }) {
  useEffect(() => {
    const onMessage = (e: Event) => {
      const { kind, text } = (e as CustomEvent<Message>).detail
      const at = { toasterId: SIGN_IN_TOASTER }
      if (kind === 'success') sonner.success(text, at)
      else if (kind === 'error') sonner.error(text, at)
      else if (kind === 'info') sonner.info(text, at)
      else
        sonner.warning(text, {
          ...at,
          duration: Infinity,
          action: deployHref ? { label: deployLabel, onClick: () => window.location.assign(deployHref) } : undefined,
          cancel: { label: closeLabel, onClick: () => {} },
        })
    }
    window.addEventListener(EVENT, onMessage)
    return () => window.removeEventListener(EVENT, onMessage)
  }, [deployHref, deployLabel, closeLabel])
  return null
}
