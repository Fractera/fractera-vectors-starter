import { spawnSync } from "node:child_process"
import { join } from "node:path"

// ЖИТЕЛЬ ДОМЕНА ПОДНИМАЕТСЯ КНОПКОЙ И ПОПАДАЕТ В СНИМОК (259-7).
//
// ✗ ОПЛАЧЕНО 2026-09-21 УТРОМ: владелец подключил `throughsongs.com` ночью,
// выключил компьютер, включил — и получил Cloudflare 1033. Автозапуск Windows
// делает `pm2 resurrect`, а тот поднимает РОВНО снимок `pm2 save`. Снимок был
// снят в 01:03, житель запущен в 04:55 руками — и в снимок не попал никогда.
// Сайт поднялся, туннель нет.
//
// 🔒 ОТСЮДА ЗАКОН: ЖИТЕЛЬ, КОТОРЫЙ ДОЛЖЕН ПЕРЕЖИТЬ ПЕРЕЗАГРУЗКУ, ЗАПУСКАЕТСЯ
// ВМЕСТЕ С `pm2 save`, И ОДНИМ ДВИЖЕНИЕМ. Запуск без сохранения живёт ровно до
// первого выключения, и узнаёт об этом человек, а не мы.
//
// 🛑 `delete` + `start`, А НЕ `restart`: pm2 хранит окружение процесса, и
// перезапуск оставил бы старый токен туннеля (закон CLAUDE.md, встречен дважды).

const isWindows = process.platform === "win32"
// shell только на Windows и только с постоянными аргументами: node не запускает
// `.cmd` без оболочки (EINVAL после CVE-2024-27980).
const PM2 = isWindows ? "pm2.cmd" : "pm2"

export const DOMAIN_RESIDENT = "fractera-web4-domain"

function pm2(args: string[]) {
  const r = spawnSync(PM2, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: isWindows,
    windowsHide: true,
    timeout: 60_000,
  })
  return { ok: r.status === 0, detail: `${r.stdout ?? ""}${r.stderr ?? ""}`.slice(-400) }
}

export type ResidentResult = { started: boolean; saved: boolean; detail?: string }

/** Поднять жителя домена заново и сохранить снимок для автозапуска. */
export function startDomainResident(): ResidentResult {
  const ecosystem = join(process.cwd(), "ecosystem.config.cjs")
  pm2(["delete", DOMAIN_RESIDENT]) // жителя может не быть — это не отказ
  const start = pm2(["start", ecosystem, "--only", DOMAIN_RESIDENT])
  if (!start.ok) return { started: false, saved: false, detail: start.detail }
  const save = pm2(["save"])
  return { started: true, saved: save.ok, detail: save.ok ? undefined : save.detail }
}

/** Перезапустить службу, чьё окружение лежит в её файле (а не в pm2). */
export function restartService(name: string): boolean {
  return pm2(["restart", name]).ok
}
