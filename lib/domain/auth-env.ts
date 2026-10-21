import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { authEnvOverrides, publicAuth } from "./public-auth.cjs"
import { restartService } from "./resident"
import { itemDir } from "@/lib/web4-items/paths.cjs"
import { listServices } from "@/lib/microservices/registry"

// ОКРУЖЕНИЕ СЛУЖБЫ ВХОДА ПЕРЕВОДИТСЯ НА ДОМЕН ТОЙ ЖЕ КНОПКОЙ (259-8).
//
// 🛑 ФАЙЛОВ ДВА, И ЭТО НЕ ПРИДИРКА. Служба запускается из standalone-сборки, а
// Next кладёт туда СВОЮ КОПИЮ `.env.local` на сборке и читает при старте именно
// её. Правка одного исходника не изменила бы ничего до следующей сборки — и
// выглядела бы как «настройка не применилась».
//
// 🔒 ПРАВЯТСЯ ТОЛЬКО ЧЕТЫРЕ ИМЕНИ, остальное (секреты, база) не трогается: файл
// порождён установщиком, и та же формула стоит в нём (`public-auth.cjs`), так что
// переустановка даст те же значения, а не петлю.

const ROOT = process.cwd()

function authFiles(): string[] {
  const dir = itemDir("auth", listServices().find((s) => s.id === "auth")?.kind)
  const files = [join(dir, ".env.local")]
  try {
    const stamp = JSON.parse(readFileSync(join(dir, ".install-stamp.json"), "utf8")) as {
      start?: { args?: string[]; cwd?: string }
    }
    const server = stamp.start?.args?.[0]
    if (server) files.push(join(stamp.start?.cwd || dir, dirname(server), ".env.local"))
  } catch { /* службы нет — ниже честное «нечего править» */ }
  return files.filter((f) => existsSync(f))
}

function patch(file: string, values: Record<string, string>) {
  let text = readFileSync(file, "utf8")
  for (const [name, value] of Object.entries(values)) {
    const re = new RegExp(`^${name}=.*$`, "m")
    text = re.test(text)
      ? text.replace(re, `${name}=${value}`)
      : `${text}${text.endsWith("\n") ? "" : "\n"}${name}=${value}\n`
  }
  writeFileSync(file, text, "utf8")
}

function currentOrigins(file: string): string[] {
  const m = readFileSync(file, "utf8").match(/^ALLOWED_ORIGINS=(.*)$/m)
  return m ? m[1].split(",").map((s) => s.trim()).filter(Boolean) : []
}

export type AuthEnvResult = { files: number; restarted: boolean; reason?: string }

/** Перевести службу входа на `auth.<зона>` и перезапустить её. */
export function applyDomainToAuth(): AuthEnvResult {
  const files = authFiles()
  if (files.length === 0) return { files: 0, restarted: false, reason: "auth-not-installed" }
  const overrides = authEnvOverrides(ROOT, currentOrigins(files[0]).filter((o) => o.startsWith("http://127.0.0.1")))
  if (!overrides) return { files: 0, restarted: false, reason: "domain-not-routed" }
  for (const f of files) patch(f, overrides)
  return { files: files.length, restarted: restartService("fractera-svc-auth") }
}

// ── ПРОВАЙДЕР GOOGLE У СЛУЖБЫ ВХОДА (265-1) ──────────────────────────────────
//
// 🔒 ТОТ ЖЕ МЕХАНИЗМ, ЧТО У ДОМЕНА, И В ЭТОМ ВЕСЬ СМЫСЛ. Способ писать в
// окружение службы уже построен и оплачен шагом 259-8: два файла, замена или
// дописывание строки, перезапуск. Второй способ рядом разошёлся бы с первым в
// первый же день правки — например, забыл бы про копию внутри standalone.
//
// 🔒 ПОЧЕМУ `restart`, А НЕ `delete` + `start`. Закон проекта «pm2 хранит
// окружение процесса» касается переменных, которые задаёт САМ pm2. Эти живут в
// файле, который Next читает при старте процесса, поэтому обычного перезапуска
// достаточно — и это не рассуждение, а наблюдение: ровно так домен перевёл
// службу на `auth.<зона>`, и вход на домене работает.
//
// 🛑 ПУСТОЕ ЗНАЧЕНИЕ — ЭТО ВЫКЛЮЧАТЕЛЬ, А НЕ ПОТЕРЯ. Служба поднимает провайдера
// только когда оба ключа непусты (`auth.config.ts`), поэтому «выключить Google»
// и «стереть пару» — одно и то же действие, и отдельного флага заводить нельзя:
// два источника правды о включённости разошлись бы молча.

const GOOGLE_ID = "GOOGLE_CLIENT_ID"
const GOOGLE_SECRET = "GOOGLE_CLIENT_SECRET"

function envValueOf(file: string, name: string): string {
  const m = readFileSync(file, "utf8").match(new RegExp(`^${name}=(.*)$`, "m"))
  return m ? m[1].trim() : ""
}

export type AuthGoogleState = {
  /** служба вообще установлена на этом узле */
  installed: boolean
  /**
   * Адрес источника для поля «Authorized JavaScript origins».
   * Для нашего потока он НЕ обязателен (Google: серверные фреймворки указывают
   * redirect URI), но поле в форме есть, и человек в него упирается. Поэтому
   * значение даётся готовым, а обязательность названа словами на экране.
   */
  javascriptOrigin: string | null
  /** ключ задан и непуст — САМО ЗНАЧЕНИЕ НАРУЖУ НЕ ВЫХОДИТ НИКОГДА */
  clientId: boolean
  clientSecret: boolean
  /**
   * Адрес, который человек обязан вписать в Google Cloud Console.
   * 🔒 ВЫВОДИТСЯ ИЗ `NEXTAUTH_URL` СЛУЖБЫ, А НЕ ПИШЕТСЯ: адрес, записанный в
   * текст, врёт в день смены домена, и человек будет искать ошибку у Google.
   * `null` — служба ещё не знает своего публичного адреса, и это честный ответ,
   * а не пустая строка.
   */
  redirectUri: string | null
}

/** Что сейчас знает служба о провайдере Google. Секретов не отдаёт. */
export function authGoogleState(): AuthGoogleState {
  const empty = {
    installed: false,
    clientId: false,
    clientSecret: false,
    redirectUri: null,
    javascriptOrigin: null,
  }
  const files = authFiles()
  if (files.length === 0) return empty
  const f = files[0]
  const base = envValueOf(f, "NEXTAUTH_URL").replace(/\/+$/, "")
  return {
    installed: true,
    clientId: envValueOf(f, GOOGLE_ID) !== "",
    clientSecret: envValueOf(f, GOOGLE_SECRET) !== "",
    // Путь колбэка задаёт NextAuth, а не мы: `/api/auth/callback/<провайдер>`.
    redirectUri: base ? `${base}/api/auth/callback/google` : null,
    javascriptOrigin: base || null,
  }
}

/**
 * Записать пару ключей Google в службу и перезапустить её.
 * Пустые значения выключают провайдера — см. закон о выключателе выше.
 */
export function setAuthGoogleKeys(clientId: string, clientSecret: string): AuthEnvResult {
  const files = authFiles()
  if (files.length === 0) return { files: 0, restarted: false, reason: "auth-not-installed" }
  for (const f of files) patch(f, { [GOOGLE_ID]: clientId, [GOOGLE_SECRET]: clientSecret })
  return { files: files.length, restarted: restartService("fractera-svc-auth") }
}

// ── ВХОД ПИСЬМОМ ЧЕРЕЗ RESEND (266-1) ────────────────────────────────────────
//
// 🔒 ТОТ ЖЕ МЕХАНИЗМ И ТОТ ЖЕ ВЫКЛЮЧАТЕЛЬ. Служба поднимает провайдера при
// непустом `RESEND_API_KEY` (`auth.config.ts`), значит пустой ключ и есть
// «выключено», и отдельного флага не заводится.
//
// 🔒 ОТПРАВИТЕЛЬ — НЕ СЕКРЕТ, И ОН ВОЗВРАЩАЕТСЯ. Ключ наружу не выходит никогда,
// а адрес отправителя человек обязан видеть: письмо с неверного адреса Resend не
// отправит, и единственный способ это заметить — прочитать, что записано.
//
// 🛑 УМОЛЧАНИЕ СЛУЖБЫ — `noreply@localhost`, И С НЕГО ПИСЬМО НЕ УЙДЁТ НИКОГДА.
// Поэтому пустой отправитель при включении не принимается дверью: включить вход
// письмом с отправителем, которого Resend заведомо отвергнет, значит поставить на
// страницу кнопку, которая молча ничего не шлёт.

const RESEND_KEY = "RESEND_API_KEY"
const RESEND_FROM = "AUTH_RESEND_FROM"

export type AuthResendState = {
  installed: boolean
  /** зона своего домена — чтобы подсказать, какой домен добавлять в Resend */
  zone: string | null
  /** ключ задан — САМО ЗНАЧЕНИЕ НАРУЖУ НЕ ВЫХОДИТ НИКОГДА */
  apiKey: boolean
  /** адрес отправителя как записан; не секрет */
  from: string | null
}

/** Что сейчас знает служба о входе письмом. Ключа не отдаёт. */
export function authResendState(): AuthResendState {
  const files = authFiles()
  const pub = publicAuth(ROOT)
  if (files.length === 0) {
    return { installed: false, zone: pub?.zone ?? null, apiKey: false, from: null }
  }
  const f = files[0]
  const from = envValueOf(f, RESEND_FROM)
  return {
    installed: true,
    zone: pub?.zone ?? null,
    apiKey: envValueOf(f, RESEND_KEY) !== "",
    from: from || null,
  }
}

/** Записать ключ и отправителя в службу и перезапустить её. Пустой ключ выключает. */
export function setAuthResendKeys(apiKey: string, from: string): AuthEnvResult {
  const files = authFiles()
  if (files.length === 0) return { files: 0, restarted: false, reason: "auth-not-installed" }
  for (const f of files) patch(f, { [RESEND_KEY]: apiKey, [RESEND_FROM]: from })
  return { files: files.length, restarted: restartService("fractera-svc-auth") }
}
