// Сторож паспорта A2A этого элемента. Стандарт и сторож живут в ядре узла (`lib/a2a/STANDARD.md`,
// `scripts/check-passport.mjs`); здесь только вызов — своей копии у элемента нет, чтобы копии не разошлись.
// Ядро ищется по `NODE_ITEMS_FILE` (реестр узла лежит в его корне), иначе — три папки вверх (WEB4-ITEMS/<kind>/<id>).
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const here = process.cwd()
let items = process.env.NODE_ITEMS_FILE?.trim()
if (!items) {
  try {
    items = readFileSync(join(here, '.env.local'), 'utf8').split(/\r?\n/).find((l) => l.startsWith('NODE_ITEMS_FILE='))?.slice(16).trim()
  } catch { /* нет файла окружения */ }
}
const candidates = [items ? dirname(dirname(items)) : null, resolve(here, '..', '..', '..')].filter(Boolean)
const core = candidates.find((c) => existsSync(join(c, 'scripts', 'check-passport.mjs')))
if (!core) {
  console.log('Узел не найден: сторож паспорта живёт в ядре узла. Запустите элемент внутри узла.')
  process.exit(2)
}
const r = spawnSync(process.execPath, [join(core, 'scripts', 'check-passport.mjs'), here], { stdio: 'inherit', windowsHide: true })
process.exit(r.status ?? 1)
