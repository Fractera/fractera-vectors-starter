// ЕДИНСТВЕННОЕ МЕСТО, ГДЕ УЗЕЛ УЗНАЁТ АДРЕС СЛУЖБЫ (257-3).
//
// ── Зачем он есть. Замысел владельца: «можно было в любой момент удалить один
// микросервис авторизации и купить другой, затем смонтировать его в систему».
// Это работает ровно до тех пор, пока адрес службы живёт В ОДНОМ месте. Измерено
// 2026-09-20: до этого файла `http://localhost:3001` стоял умолчанием в ПЯТИ
// местах, `localhost:3300` — в ВОСЬМИ. При такой раскладке «купить другую
// авторизацию» означает править тринадцать файлов узла, то есть переписывать узел.
//
// ── Почему файл читается на КАЖДЫЙ запрос, а не один раз при старте. Порт службы
// назначается установщиком и может смениться при следующей установке (наш номер
// заняли — уступили следующему). Код, запомнивший порт при старте, в день уступки
// стучится в пустоту, и отказ выглядит как поломка службы. Тот же довод, по
// которому порт самого узла спрашивается у `logs/runtime.json`, а не помнится.
//
// ── Почему при этом есть кэш на 5 секунд. Чтение файла на каждый вызов — это
// системный вызов на каждый запрос страницы. Пять секунд взяты у близнеца
// `auth-bypass`: столько же живёт там флаг режима, и этот срок измерен работой.
// Проверяется время правки файла, а не только срок: правка видна сразу.
//
// 🛑 ЭТОТ МОДУЛЬ СЕРВЕРНЫЙ. Он читает файловую систему. Импорт из файла с
// "use client" уронит сборку — и это правильное поведение: браузер реестра не
// читает никогда. То, что нужно браузеру, запекается в `NEXT_PUBLIC_*` на сборке.

import { readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import type { Registry, RegistryEntry } from "./types"
import paths from "@/lib/web4-items/paths.cjs"

const { REGISTRY_FILE } = paths

const TTL_MS = 5_000
let cached: Registry | null = null
let cachedMtime = -1
let cachedAt = 0

function read(): Registry {
  const now = Date.now()
  if (cached && now - cachedAt < TTL_MS) return cached
  cachedAt = now
  try {
    const mtime = statSync(REGISTRY_FILE).mtimeMs
    if (cached && mtime === cachedMtime) return cached
    cachedMtime = mtime
    const raw = JSON.parse(readFileSync(REGISTRY_FILE, "utf8")) as Registry
    cached = { services: Array.isArray(raw.services) ? raw.services : [] }
  } catch {
    // 🔒 ОТСУТСТВУЮЩИЙ РЕЕСТР — ЭТО ПУСТОЙ СОСТАВ, А НЕ ПАДЕНИЕ УЗЛА. Узел без
    // служб — законное состояние (человек только что скопировал репозиторий и ещё
    // не выполнил установку). Сайт обязан открыться и сказать, чего не хватает.
    cachedMtime = -1
    cached = { services: [] }
  }
  return cached
}

/** Весь состав узла, как он записан в реестре. */
export function listServices(): RegistryEntry[] {
  return read().services
}

/** Строка реестра по имени блока, или `null`, если такого блока в узле нет. */
export function getService(id: string): RegistryEntry | null {
  return read().services.find((s) => s.id === id) ?? null
}

/**
 * Адрес службы — или `null`, если её нет в реестре либо она ещё не установлена
 * (порт `null`).
 *
 * 🔒 `null` ЗДЕСЬ ЗНАЧИТ «НЕ ЗНАЮ», А НЕ «НЕТ». Вызывающий обязан различить два
 * состояния и сказать человеку разное: «служба не установлена» — это адрес, куда
 * идти; «служба не отвечает» — это отказ. Уверенное умолчание вроде
 * `http://localhost:3001` дороже отсутствующего значения: человек читает его как
 * проверенный факт и перестаёт искать.
 */
export function serviceUrl(id: string): string | null {
  const s = getService(id)
  if (!s || typeof s.port !== "number") return null
  return `http://127.0.0.1:${s.port}`
}

/** Установлена ли служба: есть в составе И имеет фактический порт. */
export function isInstalled(id: string): boolean {
  return serviceUrl(id) !== null
}

/**
 * Занятые фактические порты — установщику, чтобы назначать следующий свободный,
 * и сторожу, чтобы поймать двух претендентов на один номер.
 */
export function takenPorts(): number[] {
  return read()
    .services.map((s) => s.port)
    .filter((p): p is number => typeof p === "number")
}
