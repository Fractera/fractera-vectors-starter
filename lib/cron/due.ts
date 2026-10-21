import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

// РАСПИСАНИЕ ЭЛЕМЕНТА — ЧТЕНИЕ И «ПОРА ЛИ» (шаг 465). Правило «бывает ли в этот день» то же, что у календаря ядра
// (cron-calendar.client.tsx). Времена — местные часы компьютера узла.
//
// 🔒 465-4 (владелец 2026-10-12: «автоматизация рабочего процесса не должна приводить к сборке проекта … Только строительный
// процесс должен приводить к сборке»). Два файла разной природы:
// - `OWN-SERVICE-PROPS/CRON.json` (git) — что элемент УМЕЕТ: каталог событий (код) и `seed` — пример расписания для нового элемента.
//   Меняется только строительным процессом.
// - `data/cron.json` (вне git) — РАСПИСАНИЕ человека: `schedules`, `repeatsPaused`. Рабочий процесс: агент правит этот файл, и всё —
//   ни кода, ни коммита, ни сборки; сервер читает его раз в минуту.
// ✗ Оплачено: расписание лежало в git, а текст напоминания нельзя было вписать — агент на «напомни про день рождения» написал код,
// коммит и попросил пересобрать элемент.

export type CronRepeat = "once" | "daily" | "weekdays" | "weekly" | "monthly"
export type CronEvent = { id: string; name: string; description: string }
export type CronSchedule = {
  id: string; event: string; name?: string; message?: string
  time: string; repeat: CronRepeat; start: string; until?: string; enabled: boolean
}
export type CronPlan = { repeatsPaused: boolean; events: CronEvent[]; schedules: CronSchedule[] }

/** Встроенное событие: отправить человеку текст `message` записи. Новое напоминание = запись, а не код. */
export const TELEGRAM_MESSAGE = "telegram-message"

const REPEATS = new Set(["once", "daily", "weekdays", "weekly", "monthly"])

/** Папка элемента: собранный сервер делает chdir в свою сборку, поэтому сначала ELEMENT_DIR. */
export const elementDir = () => process.env.ELEMENT_DIR?.trim() || process.cwd()
export const scheduleFile = () => join(elementDir(), "data", "cron.json")

const readJson = (file: string): Record<string, unknown> | null => {
  try { return JSON.parse(readFileSync(file, "utf8")) } catch { return null }
}

/**
 * Нет расписания человека — создать его один раз из `seed` (первый старт элемента = «регистрация»). Зовётся при старте сервера.
 * 465-5 (владелец 2026-10-12: «Новому пользователю … одной автоматической задачей через 24 часа после регистрации»): запись засева
 * с `afterHours` становится разовой на «сейчас + N часов» — дата и время считаются здесь, по местным часам компьютера.
 */
export function seedSchedule(now = new Date()): boolean {
  if (existsSync(scheduleFile())) return false
  const catalog = readJson(join(elementDir(), "OWN-SERVICE-PROPS", "CRON.json"))
  const seed = catalog?.seed as { repeatsPaused?: boolean; schedules?: (Partial<CronSchedule> & { afterHours?: number })[] } | undefined
  if (!seed) return false
  const schedules = (seed.schedules ?? []).map(({ afterHours, ...s }) => {
    if (typeof afterHours !== "number") return s
    const at = new Date(now.getTime() + afterHours * 3_600_000)
    return { ...s, repeat: "once", start: ymd(at), time: hm(at) }
  })
  mkdirSync(join(elementDir(), "data"), { recursive: true })
  writeFileSync(scheduleFile(), JSON.stringify({ repeatsPaused: seed.repeatsPaused === true, schedules }, null, 2) + "\n")
  return true
}

export function readPlan(): CronPlan | null {
  const catalog = readJson(join(elementDir(), "OWN-SERVICE-PROPS", "CRON.json"))
  const own = readJson(scheduleFile())
  if (!catalog && !own) return null
  const schedules = ((Array.isArray(own?.schedules) ? own.schedules : []) as CronSchedule[])
    .filter((s) => s && typeof s.id === "string" && /^\d{2}:\d{2}$/.test(s.time) && REPEATS.has(s.repeat) && /^\d{4}-\d{2}-\d{2}$/.test(s.start))
  const events = (Array.isArray(catalog?.events) ? catalog.events : []) as CronEvent[]
  return { repeatsPaused: own?.repeatsPaused === true, events, schedules }
}

const pad = (n: number) => String(n).padStart(2, "0")
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

export function occursOn(s: CronSchedule, day: Date): boolean {
  const key = ymd(day)
  if (key < s.start || (s.until && key > s.until)) return false
  const [y, m, d] = s.start.split("-").map(Number)
  const start = new Date(y, m - 1, d)
  const dow = day.getDay()
  switch (s.repeat) {
    case "once": return key === s.start
    case "daily": return true
    case "weekdays": return dow >= 1 && dow <= 5
    case "weekly": return dow === start.getDay()
    case "monthly": return day.getDate() === start.getDate()
  }
}

/** Выключено ли: своё `enabled:false` или «все повторяющиеся выключены» (разовые всё равно срабатывают). */
export const isOff = (plan: CronPlan, s: CronSchedule) => !s.enabled || (plan.repeatsPaused && s.repeat !== "once")

/** Расписания, которым пора в эту минуту. */
export function dueAt(plan: CronPlan, minute: Date): CronSchedule[] {
  const t = hm(minute)
  return plan.schedules.filter((s) => s.time === t && !isOff(plan, s) && occursOn(s, minute))
}
