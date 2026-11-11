// СВОЁ ОФОРМЛЕНИЕ ЭЛЕМЕНТА ИЗ БРАУЗЕРА (шаг 579-1). Редакторы ходят в дверь
// этого элемента внутри его ветки: `/<язык>/admin/api/settings/design` (закон 422 — дверь в своей ветке, язык в адресе как цена).
// 🔒 Отказ двери — это СОСТОЯНИЕ, а не пустые настройки: «войдите», «вы не архитектор», «вход недоступен» и «ошибка»
// различаются, и ни одно не рисуется как «ничего не настроено» (урок 2026-09-25: пустота, принятая за ответ, обесцветила ядро).
export type Access = 'loading' | 'ok' | 'signin' | 'forbidden' | 'unavailable' | 'error'
export type Loaded = { access: Access; config: Record<string, unknown> | null }

const accessOf = (status: number): Access =>
  status === 200 ? 'ok' : status === 401 ? 'signin' : status === 403 ? 'forbidden' : status === 503 ? 'unavailable' : 'error'

function designDoor(): string {
  const lang = (typeof document !== 'undefined' && document.documentElement.lang) || 'en'
  return `/${lang}/admin/api/settings/design`
}

export async function loadDesign(): Promise<Loaded> {
  try {
    const r = await fetch(designDoor(), { cache: 'no-store' })
    const body = await r.json().catch(() => null)
    const access = accessOf(r.status)
    return { access, config: access === 'ok' && body?.ok ? (body.config as Record<string, unknown>) : null }
  } catch {
    return { access: 'unavailable', config: null }
  }
}

export async function saveDesignPatch(patch: Record<string, unknown>): Promise<Loaded> {
  try {
    const r = await fetch(designDoor(), {
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

export type AccessWords = {
  loading: string
  signin: string
  signinLink: string
  forbidden: string
  unavailable: string
  error: string
}
