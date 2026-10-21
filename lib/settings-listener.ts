// СЛУШАТЕЛЬ ИЗМЕНЕНИЙ НАСТРОЕК ПРОЕКТА (шаг 306, слово владельца 2026-09-26: «строим уведомление от CONFIG»).
//
// Модуль переносимый: две функции и одна дверь — всё, что нужно любой службе узла, чтобы правка в CONFIG доходила до неё
// без перезапуска. Как устроено и как перенести — `lib/settings-listener.README.md`.
//
// 🔒 СИГНАЛ — НЕ НАСТРОЙКИ. CONFIG присылает только «версия сменилась»; настройки служба забирает сама, тем же путём,
// что при старте (`pullProjectSettings`). Путь чтения остаётся один, и подделанный сигнал ничего не меняет сверх того,
// что и так лежит в CONFIG.
// 🔒 ДЕЙСТВИЕ — ТОЛЬКО В ОТВЕТ НА СОХРАНЕНИЕ ЧЕЛОВЕКОМ. Таймеров, опроса и повторов нет: пропущенный сигнал служба
// наверстает при следующем старте, сверив версию.
import { timingSafeEqual } from "node:crypto"
import { callTool, pullProjectSettings, type PullResult } from "@/lib/project-settings"

/** Адрес двери этой службы, по которому CONFIG шлёт сигнал. Внутри узла — петля и свой порт. */
export function listenerUrl(): string | null {
  const port = Number(process.env.PORT)
  return Number.isInteger(port) && port > 0 ? `http://127.0.0.1:${port}/api/settings/changed` : null
}

export type SubscribeResult = { ok: true; url: string } | { ok: false; reason: string; detail?: string }

/** Подписаться на сигнал CONFIG. Зовётся при каждом старте: один адрес — одна запись у CONFIG. */
export async function subscribeToConfig(who: string): Promise<SubscribeResult> {
  const base = process.env.CONFIG_SERVICE_URL?.trim().replace(/\/+$/, "")
  const key = process.env.SETTINGS_SECRET?.trim()
  const url = listenerUrl()
  if (!base) return { ok: false, reason: "no-config-element" }
  if (!key) return { ok: false, reason: "no-settings-key" }
  if (!url) return { ok: false, reason: "no-port" }
  try {
    await callTool(base, key, "subscribe", { url, who })
    return { ok: true, url }
  } catch (err) {
    return { ok: false, reason: "subscribe-failed", detail: err instanceof Error ? err.message : String(err) }
  }
}

/** Сигнал пришёл с ключом узла? Ключ тот же, которым служба читает CONFIG. */
export function signalKeyOk(given: string | null): boolean {
  const expected = process.env.SETTINGS_SECRET ?? ""
  const g = given ?? ""
  if (!expected || g.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(g), Buffer.from(expected))
}

/** Обработать сигнал: забрать настройки. Обновление страниц — у двери (оно живёт только в обработчике маршрута). */
export function onSettingsSignal(): Promise<PullResult> {
  return pullProjectSettings()
}
