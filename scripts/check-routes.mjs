// СТОРОЖ МАРШРУТОВ (node step 314-2): файлы маршрутов элемента — ЗАКРЫТЫЙ СПИСОК.
//
// ✗ Измерено на узле (шаг 298): 300 страниц отдельными `page.tsx` собирались 1252 с, те же 300 страниц одним шаблоном —
// 98 с. Каждый файл маршрута Next компилирует отдельно, и сборка растёт от ЧИСЛА ФАЙЛОВ, а не страниц. Поэтому у ветки в
// коде только корень (`layout.tsx`, `page.tsx`) и один ребёнок `[slug]/page.tsx`; новая страница — это ПАПКА ДАННЫХ
// `<ветка>/_pages/<slug>/` (`meta.json` + `<язык>.json`), а не новый файл маршрута (навык `.claude/skills/build-skills/skills/use-page-tree`).
//
// Файл вне списка — отказ сборки. Новая ВЕТКА (новый корень) — решение человека: строка сюда вместе с причиной.
// 🛑 Папка `pages/` в корне — Pages Router Next: любая папка там стала бы маршрутом. Запрещена.
import { readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const ROUTE_FILE = /^(page|route|layout|default|template|sitemap|robots|manifest)\.(tsx?|jsx?)$/

const ALLOWED = new Map([
  // корень приложения
  ['app/layout.tsx', 'корневой макет'],
  ['app/sitemap.ts', 'карта сайта — из дерева данных'],
  ['app/robots.ts', 'robots.txt'],
  ['app/manifest.ts', 'манифест PWA'],
  ['app/favicon.ico/route.ts', 'значок сайта'],
  ['app/og-default.png/route.ts', 'картинка соцсетей по умолчанию'],
  ['app/llms.txt/route.ts', 'карта для ИИ-агентов'],
  ['app/llms-full.txt/route.ts', 'полные тексты для ИИ-агентов'],
  ['app/[lang]/layout.tsx', 'макет языка: <html>, шапка, подвал'],
  ['app/[lang]/llms.txt/route.ts', 'карта для ИИ-агентов на языке'],
  ['app/[lang]/llms-full.txt/route.ts', 'полные тексты для ИИ-агентов на языке'],
  ['app/[lang]/manifest.webmanifest/route.ts', 'манифест на языке'],
  // ветка «публичная»
  ['app/[lang]/(publicLayer)/page.tsx', 'КОРЕНЬ публичной ветки — главная'],
  ['app/[lang]/(publicLayer)/index.md/route.ts', 'главная для агентов (markdown)'],
  ['app/[lang]/(publicLayer)/[slug]/page.tsx', 'РЕБЁНОК публичной ветки — все страницы _pages/'],
  ['app/[lang]/(publicLayer)/[slug]/index.md/route.ts', 'markdown-двойник любого ребёнка публичной ветки'],
  // сниппеты страниц (шаг узла 458-3; владелец 2026-10-12: «Картинка рядом со страницей»): PNG при первом запросе, без пересборки
  ['app/[lang]/(publicLayer)/snippet.png/route.ts', 'сниппет главной'],
  ['app/[lang]/(publicLayer)/[slug]/snippet.png/route.ts', 'сниппет любого ребёнка публичной ветки'],
  ['app/api/own-service-props/route.ts', 'паспорт элемента — главная дверь (шаг узла 417; владелец 2026-10-06: «сервер который возвращает этот файл наружу, пока … без ключа»)'],
  ['app/api/a2a/route.ts', 'конечная точка A2A (привязка JSON-RPC, A2A v1.0; владелец 2026-10-05: «сейчас, делай конечную точку A2A»)'],
  ['app/.well-known/agent-card.json/route.ts', 'визитка A2A элемента (спецификация A2A v1.0, шаг узла 406-3)'],
  ['app/api/a2a/tasks/[id]/route.ts', 'ответ агента элемента в задачу A2A (шаг узла 409-2; владелец 2026-10-05: «Разрешить дверь»)'],
  // защищённый слой: четыре ветки-категории
  ['app/[lang]/(protectedLayer)/layout.tsx', 'слой закрыт от поиска'],
  ['app/[lang]/(protectedLayer)/account/layout.tsx', 'замок ветки account'],
  ['app/[lang]/(protectedLayer)/account/page.tsx', 'КОРЕНЬ ветки account'],
  ['app/[lang]/(protectedLayer)/account/[...slug]/page.tsx', 'РЕБЁНОК ветки account: страница и страница в папке роли (402)'],
  ['app/[lang]/(protectedLayer)/staff/layout.tsx', 'замок ветки staff'],
  ['app/[lang]/(protectedLayer)/staff/page.tsx', 'КОРЕНЬ ветки staff'],
  ['app/[lang]/(protectedLayer)/staff/[...slug]/page.tsx', 'РЕБЁНОК ветки staff: страница и страница в папке роли (402)'],
  ['app/[lang]/(protectedLayer)/finance/layout.tsx', 'замок ветки finance'],
  ['app/[lang]/(protectedLayer)/finance/page.tsx', 'КОРЕНЬ ветки finance'],
  ['app/[lang]/(protectedLayer)/finance/[...slug]/page.tsx', 'РЕБЁНОК ветки finance: страница и страница в папке роли (402)'],
  ['app/[lang]/(protectedLayer)/admin/layout.tsx', 'замок ветки admin'],
  ['app/[lang]/(protectedLayer)/admin/page.tsx', 'КОРЕНЬ ветки admin'],
  ['app/[lang]/(protectedLayer)/admin/[...slug]/page.tsx', 'РЕБЁНОК ветки admin: страница и страница в папке роли (402)'],
  ['app/[lang]/(protectedLayer)/admin/blocks/[section]/page.tsx', 'раздел блоков элемента — таблица раздела (577-11)'],
  ['app/[lang]/(protectedLayer)/admin/blocks/[section]/[name]/page.tsx', 'Preview одного блока элемента — крошки и один блок (577-11)'],
  // ветка «messenger-h2a» (шаг узла 459, владелец 2026-10-12: «H2H Messenger – H2A Messenger … только при входе архитектора»)
  ['app/[lang]/(protectedLayer)/messenger-h2a/layout.tsx', 'замок ветки messenger-h2a: только архитектор'],
  ['app/[lang]/(protectedLayer)/messenger-h2a/page.tsx', 'КОРЕНЬ ветки messenger-h2a: список бесед'],
  ['app/[lang]/(protectedLayer)/messenger-h2a/[...slug]/page.tsx', 'РЕБЁНОК ветки messenger-h2a: одна беседа, динамический маршрут'],
  // ветка «гостевая»
  ['app/[lang]/(guestLayer)/guest/layout.tsx', 'замок гостевой ветки: гостевой вход'],
  ['app/[lang]/(guestLayer)/guest/page.tsx', 'КОРЕНЬ гостевой ветки'],
  ['app/[lang]/(guestLayer)/guest/[slug]/page.tsx', 'РЕБЁНОК гостевой ветки'],
  // двери API — не страницы
  ['app/api/config-image/[slot]/route.ts', 'картинки настроек'],
  ['app/api/tools/tool-voice-input/route.ts', 'дверь инструмента tool-voice-input: расшифровка речи (узел, шаг 421; владелец 2026-10-07: «get all from fractera-next-starter»)'],
  ['app/api/tools/tool-socials-ai/route.ts', 'дверь инструмента tool-socials-ai: соцсеть по описанию (узел, шаг 421)'],
  ['app/api/health/route.ts', 'жив ли элемент — для сторожа узла'],
  ['app/api/task-report/route.ts', 'отчёт о задаче для окна предпросмотра (узел, шаг 356-2)'],
  ['app/api/i18n/translate/route.ts', 'перевод строк'],
  ['app/api/auth/callback/route.ts', 'возврат из центра единого входа (328-3)'],
  ['app/api/auth/guest-leave/route.ts', 'гость удаляет свою запись и уходит (331-2)'],
  ['app/api/settings/platform/route.ts', 'архитектор закрывает индикатор ширины (333-4)'],
  ['app/api/core-origin/route.ts', 'адрес ядра своего узла (324-6)'],
  ['app/api/me/route.ts', 'кто вошёл'],
  ['app/api/media-proxy/[...path]/route.ts', 'медиа через узел'],
  ['app/api/media/[id]/file/route.ts', 'файл медиа'],
  ['app/api/media/icons/[setId]/file/[name]/route.ts', 'значки медиа'],
  ['app/api/media/upload/route.ts', 'загрузка медиа'],
  ['app/api/menu/[lang]/route.ts', 'меню проекта'],
  ['app/api/revalidate/route.ts', 'перерисовать страницы'],
  ['app/[lang]/(protectedLayer)/admin/api/settings/app/route.ts', 'дверь виджета widget-dynamic-site-settings: свои настройки элемента (324-8, 422 — дверь в своей ветке)'],
  ['app/api/settings/changed/route.ts', 'сигнал CONFIG и «Дизайна»'],
  ['app/api/settings/design/route.ts', 'дверь дизайна элемента'],
  ['app/api/shell/[lang]/route.ts', 'шапка и подвал для служб узла'],
  ['app/api/users/[id]/route.ts', 'одна учётная запись'],
  ['app/api/users/route.ts', 'учётные записи'],
  // 550 (владелец 2026-10-21: «data = база данных, старые адреса пересылают»): двери прежнего слоя данных, которые несёт vectors.
  ['app/health/route.ts', 'vectors: прежняя дверь /health для сторожа узла (550)'],
  ['app/capabilities/route.ts', 'vectors: элемент описывает свои двери (550)'],
  ['app/vectors/[[...path]]/route.ts', 'vectors: векторы узла: запись, поиск ближайших, удаление, состояние (550)'],
])

const found = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (ROUTE_FILE.test(name)) found.push(relative(ROOT, p).split(sep).join('/'))
  }
}
walk(join(ROOT, 'app'))

const extra = found.filter((f) => !ALLOWED.has(f))
const pagesRouter = existsSync(join(ROOT, 'pages'))
if (extra.length || pagesRouter) {
  console.error('===ROUTES_FAILED=== файл маршрута вне закрытого списка:')
  for (const f of extra) console.error(`  ${f}`)
  if (pagesRouter) console.error('  pages/ — это Pages Router Next, папка запрещена')
  console.error('Новая страница = папка <ветка>/_pages/<slug>/ (meta.json + <язык>.json), а не page.tsx.')
  console.error('Навык: .claude/skills/build-skills/skills/use-page-tree. Новая ветка — решение человека: строка в ALLOWED этого файла, с причиной.')
  process.exit(1)
}
// ОБЯЗАТЕЛЬНЫЕ ПАПКИ ВЕТКИ (владелец 2026-10-07: «мы их совершенно забыли указать … проверь чтобы они существовали в проекте для
// всех маршрутов»): у каждого КОРНЯ ветки — `_components/`, `_libs/`, `_widgets/`, в каждой README.md о назначении её файлов.
// Корни берутся из этого же списка (строки «КОРЕНЬ»), второго списка веток нет.
const REQUIRED_FOLDERS = ['_components', '_libs', '_widgets']
const branchRoots = [...ALLOWED].filter(([, why]) => why.startsWith('КОРЕНЬ')).map(([f]) => f.slice(0, f.lastIndexOf('/')))
const noFolder = branchRoots.flatMap((b) => REQUIRED_FOLDERS.filter((d) => !existsSync(join(ROOT, b, d, 'README.md'))).map((d) => `${b}/${d}/README.md`))
if (noFolder.length) {
  console.error('===ROUTES_FAILED=== у ветки нет обязательной папки или её README.md:')
  for (const f of noFolder) console.error(`  ${f}`)
  console.error('Каждая ветка: _components/ (свои компоненты), _libs/ (своя логика), _widgets/ (свои виджеты) — см. `.claude/modes/build.md`, «Tree».')
  process.exit(1)
}
const missing = [...ALLOWED.keys()].filter((f) => !found.includes(f))
if (missing.length) console.warn(`[check-routes] в списке, но файла нет (строку убрать): ${missing.join(', ')}`)
console.log(`===ROUTES_OK=== файлов маршрутов ${found.length}, все в закрытом списке`)
