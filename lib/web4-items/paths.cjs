// ГДЕ ЛЕЖАТ ЭЛЕМЕНТЫ WEB4 И ИХ РЕЕСТР — ОДНО МЕСТО НА ВЕСЬ УЗЕЛ (272).
//
// 🎯 Слово владельца 2026-09-22: «можем заменить название микросервиса на WEB4-ITEMS, а внутри сделать две
// папки — встроенные (core) и пользовательские; а также MICROSERVICES.json положить в
// WEB4-ITEMS-REGISTRY/web4-items.json».
//
// 🔒 ПУТЬ СТРОИТСЯ ИЗ `kind` ЗАПИСИ РЕЕСТРА, А НЕ УГАДЫВАЕТСЯ ПО ИМЕНИ: `core` ставит узел, `user`
// подключает человек. Знание «где лежит элемент» живёт здесь ОДИН раз — его читают и сборка (`.ts`), и
// скрипты (`.mjs`), и диспетчер процессов (`ecosystem.config.cjs`).
// 🛑 ВТОРАЯ КОПИЯ ЭТОГО ЗНАНИЯ ЕСТЬ, И ОНА НАЗВАНА ВСЛУХ: `_agent-kit/server/workspace.cjs` комплекта
// агента. Копия комплекта обязана быть самодостаточной — она уезжает в папку службы целиком, — поэтому
// импортировать отсюда не может. Расхождение ловит `npm run check:agent-kits` через отпечаток мастера.
// 🪦 До 272: реестр `MICROSERVICES.json` в корне, папка `microservices/<id>` без деления на встроенные и
// пользовательские.

const path = require('node:path')

// 🛑 КОРЕНЬ — `process.cwd()`, как у всего узла: и сервер, и скрипты запускаются из корня проекта.
const ROOT = process.cwd()

/** Папка всех элементов узла. Целиком в `.gitignore`: у каждого элемента свой репозиторий. */
const ITEMS_DIR = path.join(ROOT, 'WEB4-ITEMS')

/** Реестр состава узла. */
const REGISTRY_FILE = path.join(ROOT, 'WEB4-ITEMS-REGISTRY', 'web4-items.json')

const KINDS = ['core', 'user']

/** Папка одного элемента: `WEB4-ITEMS/<kind>/<id>`. Неизвестный род — `core`, как у встроенных. */
function itemDir(id, kind) {
  return path.join(ITEMS_DIR, KINDS.includes(kind) ? kind : 'core', id)
}

/** Папка элемента по записи реестра. */
function entryDir(entry) {
  return itemDir(entry.id, entry.kind)
}

module.exports = { ITEMS_DIR, REGISTRY_FILE, KINDS, itemDir, entryDir }
