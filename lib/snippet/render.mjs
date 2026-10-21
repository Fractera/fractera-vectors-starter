// СНИППЕТ СТРАНИЦЫ — заголовок, описание и фон → PNG 1200×630 в цвете дизайна (шаг узла 458-2).
//
// Слово владельца 2026-10-12: «функцию … которая бы принимала заголовок, принимала описание принимала Background и возвращала
// бы снипет для каждой страницы в стиле который соответствует дизайну то есть если дизайн зелёный то нужно чтобы это отлива
// соответствующим цвету».
//
// Одна функция на весь проект: она ничего не знает о документах, блоге или лендинге — её зовёт сценарий сборки
// (`scripts/build-snippets.mjs`) для любой страницы. Обычный JavaScript, а не TypeScript, чтобы её мог вызвать сценарий
// prebuild без сборщика.
//
// 🔒 ЦВЕТА — ТОЛЬКО ИЗ DESIGN-CONFIG (тёмная палитра: фон, текст, primary). Ни одного значения цвета в коде: смена дизайна
// с синего на зелёный перекрашивает каждый снимок при следующей сборке.
// 🔒 ТЕКСТ — КОНТУРАМИ (satori), А НЕ ШРИФТОМ СИСТЕМЫ. Satori превращает буквы в пути SVG, и sharp рисует их без
// шрифтов сервера: на машине без кириллических шрифтов заголовок не превращается в квадраты.
// 🛑 Satori не читает `.woff2`; шрифт — статический Inter из `@fontsource/inter` в `.woff` (400 и 700, латиница и кириллица).
// 🛑 Снимок создаётся при сборке: правка дизайна без пересборки снимки не перекрашивает (страницы — тоже статические).
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import satori from 'satori'
import sharp from 'sharp'

export const SNIPPET_WIDTH = 1200
export const SNIPPET_HEIGHT = 630

/** Тёмная палитра дизайна: DESIGN-CONFIG/design-config.json поверх DESIGN-CONFIG/defaults.json. */
export function designColors(root) {
  const read = (f) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(root, 'DESIGN-CONFIG', f), 'utf8'))
    } catch {
      return {}
    }
  }
  const dark = { ...(read('defaults.json').colors?.dark ?? {}), ...(read('design-config.json').colors?.dark ?? {}) }
  for (const k of ['background', 'foreground', 'primary']) {
    if (!dark[k]) throw new Error(`===SNIPPET_NO_COLOR=== DESIGN-CONFIG has no dark.${k}`)
  }
  return dark
}

// 🛑 У каждого подмножества своё имя: под одним именем satori берёт первое и не ищет букву в остальных (замерено:
// кириллица вышла «NO GLYPH»). Перечень имён — fontFamily ниже, по нему satori ищет каждую букву.
const SUBSETS = ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext']
const FAMILY = SUBSETS.map((s) => `Inter-${s}`).join(', ')
const fontCache = new Map()
function fonts(root) {
  if (fontCache.has(root)) return fontCache.get(root)
  const require = createRequire(path.join(root, 'package.json'))
  const dir = path.dirname(require.resolve('@fontsource/inter/package.json'))
  const list = []
  for (const weight of [400, 700]) {
    for (const subset of SUBSETS) {
      const file = path.join(dir, 'files', `inter-${subset}-${weight}-normal.woff`)
      if (fs.existsSync(file)) list.push({ name: `Inter-${subset}`, data: fs.readFileSync(file), weight, style: 'normal' })
    }
  }
  if (!list.length) throw new Error('===SNIPPET_NO_FONT=== @fontsource/inter is not installed')
  fontCache.set(root, list)
  return list
}

/** «#2563eb» → «rgba(37, 99, 235, a)»; иные записи цвета — как есть (без прозрачности). */
function alpha(color, a) {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim())
  if (!m) return color
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

/** Узор, когда у проекта нет своего фона: устойчивый (зерно — текст), в цвете primary. Его же сохраняет навык без ключа. */
export function patternSvg(seedText, c) {
  let s = 2166136261
  for (let i = 0; i < seedText.length; i++) s = Math.imul(s ^ seedText.charCodeAt(i), 16777619)
  const rnd = () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0) % 10000) / 10000
  const circles = Array.from({ length: 14 }, () => {
    const r = 40 + rnd() * 220
    return `<circle cx="${(rnd() * SNIPPET_WIDTH).toFixed(0)}" cy="${(rnd() * SNIPPET_HEIGHT).toFixed(0)}" r="${r.toFixed(0)}" fill="none" stroke="${c.primary}" stroke-opacity="${(0.08 + rnd() * 0.22).toFixed(2)}" stroke-width="${(1 + rnd() * 3).toFixed(1)}"/>`
  }).join('')
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SNIPPET_WIDTH}" height="${SNIPPET_HEIGHT}"><rect width="100%" height="100%" fill="${c.background}"/>${circles}</svg>`,
  )
}

/** Размер заголовка по длине: короткий — крупно, длинный — мельче, но всегда целыми словами (переносит satori). */
function titleSize(title) {
  const n = title.length
  return n <= 28 ? 84 : n <= 48 ? 72 : n <= 72 ? 60 : 50
}

/**
 * Снимок страницы.
 * @param {{ title: string, description?: string, background?: string | null, root: string, colors?: object | null }} o
 *   background — путь к картинке фона (любой формат sharp); нет — узор в цвете дизайна. root — корень проекта.
 *   colors — палитра поверх DESIGN-CONFIG (предпросмотр другого дизайна до сохранения); обычно не передаётся.
 * @returns {Promise<Buffer>} PNG 1200×630
 */
export async function renderSnippet({ title, description = '', background = null, root, colors = null }) {
  const c = { ...designColors(root), ...(colors ?? {}) }
  const W = SNIPPET_WIDTH
  const H = SNIPPET_HEIGHT

  const base = background && fs.existsSync(background)
    ? sharp(background).resize(W, H, { fit: 'cover' })
    : sharp(patternSvg(title, c))

  // Отлив цветом дизайна: слева фон темы (текст читается на любой картинке), справа — свечение primary.
  const tint = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${c.background}" stop-opacity="0.92"/>
          <stop offset="0.6" stop-color="${c.background}" stop-opacity="0.72"/>
          <stop offset="1" stop-color="${c.background}" stop-opacity="0.35"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.85" cy="0.15" r="0.75">
          <stop offset="0" stop-color="${c.primary}" stop-opacity="0.55"/>
          <stop offset="1" stop-color="${c.primary}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#shade)"/>
      <rect width="100%" height="100%" fill="url(#glow)"/>
      <rect x="0" y="${H - 10}" width="${W}" height="10" fill="${c.primary}"/>
    </svg>`,
  )

  const text = await satori(
    {
      type: 'div',
      props: {
        style: { width: W, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '72px 80px', fontFamily: FAMILY },
        children: [
          { type: 'div', props: { style: { width: 96, height: 8, borderRadius: 4, background: c.primary, marginBottom: 36 } } },
          {
            type: 'div',
            props: {
              style: { fontSize: titleSize(title), fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em', color: c.foreground, maxWidth: 1000, lineClamp: 3 },
              children: title,
            },
          },
          ...(description
            ? [
                {
                  type: 'div',
                  props: {
                    style: { marginTop: 28, fontSize: 30, fontWeight: 400, lineHeight: 1.35, color: alpha(c.foreground, 0.78), maxWidth: 940, lineClamp: 3 },
                    children: description,
                  },
                },
              ]
            : []),
        ],
      },
    },
    { width: W, height: H, fonts: fonts(root) },
  )

  return base
    .composite([{ input: tint }, { input: Buffer.from(text) }])
    .png()
    .toBuffer()
}
