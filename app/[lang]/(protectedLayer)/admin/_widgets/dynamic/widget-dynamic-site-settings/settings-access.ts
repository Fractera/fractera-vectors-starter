import { settingsUrl } from './settings-door'
// ДОСТУП К НАСТРОЙКАМ ИЗ БРАУЗЕРА (шаг 299-4). Экраны режима архитектора — статическая оболочка; значения приходят
// островку из двери элемента (`/api/settings/<вид>`), которая сама проверяет, архитектор ли смотрит.
// 🔒 Отказ двери — это СОСТОЯНИЕ, а не пустые настройки: «войдите», «вы не архитектор», «вход недоступен» и «ошибка»
// различаются, и ни одно не рисуется как «ничего не настроено» (урок 2026-09-25: пустота, принятая за ответ, обесцветила ядро).
export type SettingsKind = 'app' | 'platform' | 'design'
export type Access = 'loading' | 'ok' | 'signin' | 'forbidden' | 'unavailable' | 'error'
// `applied` — сколько служб приняли сигнал после сохранения (306); у чтения его нет.
export type Loaded = { access: Access; config: Record<string, unknown> | null; applied?: number }

const accessOf = (status: number): Access =>
  status === 200 ? 'ok' : status === 401 ? 'signin' : status === 403 ? 'forbidden' : status === 503 ? 'unavailable' : 'error'

export async function loadSettings(kind: SettingsKind): Promise<Loaded> {
  try {
    const r = await fetch(settingsUrl(kind), { cache: 'no-store' })
    const body = await r.json().catch(() => null)
    const access = accessOf(r.status)
    const applied = Array.isArray(body?.notified) ? body.notified.filter((n: { ok?: boolean }) => n?.ok).length : 0
    return { access, config: access === 'ok' && body?.ok ? (body.config as Record<string, unknown>) : null, applied }
  } catch {
    return { access: 'unavailable', config: null }
  }
}

export async function saveSettings(kind: SettingsKind, patch: Record<string, unknown>): Promise<Loaded> {
  try {
    const r = await fetch(settingsUrl(kind), {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const body = await r.json().catch(() => null)
    const access = accessOf(r.status)
    return { access, config: access === 'ok' && body?.ok ? (body.config as Record<string, unknown>) : null }
  } catch {
    return { access: 'unavailable', config: null }
  }
}

export type AccessWords = { loading: string; signin: string; signinLink: string; forbidden: string; unavailable: string; error: string }
