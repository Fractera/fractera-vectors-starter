import 'server-only'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Block, FaqPair } from '@/lib/content/blocks/types'

// ДЕРЕВО СТРАНИЦ ЭЛЕМЕНТА (node step 314-2). Страница — папка данных, а не файл маршрута:
//
//   app/[lang]/<ветка>/_data/{meta,en,ru}.json          — корень ветки
//   app/[lang]/<ветка>/_pages/<slug>/{meta,en,ru}.json  — ребёнок ветки, его рисует один `[slug]/page.tsx`
//
// Почему так — замер узла (шаг 298): сборка растёт от числа ФАЙЛОВ-маршрутов, а не страниц; 300 файлов `page.tsx` —
// 1252 с, те же 300 страниц одним шаблоном — 98 с. Поэтому новый адрес = новая папка данных, никогда не новый `page.tsx`.
//
// 🔒 ДАННЫЕ ЧИТАЮТСЯ ВО ВРЕМЯ РАБОТЫ, А НЕ ЗАПЕКАЮТСЯ СБОРКОЙ: исправленный абзац виден после обновления страницы (5 минут),
// без пересборки. Путь — папка элемента из `ELEMENT_DIR`: standalone-сервер Next при старте переходит в `.next/standalone`,
// и `process.cwd()` указывает на копию в сборке. Без переменной читается эта копия (`outputFileTracingIncludes` в
// `next.config.ts`) — сайт работает, но правка текста тогда видна только после пересборки.
// 🔒 `en.json` обязателен (основа), остальные `<язык>.json` — переводы поверх неё. Нет перевода — английская основа.

export type PageMeta = {
  /** Порядок среди детей ветки. */
  order?: number
  /** Роли, которые открывают страницу (второй замок поверх замка ветки). Архитектор проходит всегда. */
  roles?: string[]
  /** 423: страница без рамки (лендинг на весь экран): рисуются только её виджеты (`widget-*` последовательности), а блоки и
   *  текст остаются её словами — виджет читает их — и текстовым близнецом для агентов (`index.md`); метаданные — из заголовка
   *  и описания. Виджет обычной страницы просто стоит в последовательности `blocks` на своём месте. */
  bare?: boolean
  /** Картинка для соцсетей. */
  ogImage?: string
  /** 431: страница предлагает услугу — разметка schema.org `Service` вместо `Article`. Название и описание — слова страницы
   *  на её языке; здесь только то, что не переводится. Нет поля — обычная статья. */
  service?: ServiceMeta
}

export type ServiceMeta = {
  /** Кто оказывает; нет — имя сайта. */
  provider?: string
  /** Где: «Gran Vía, Madrid». */
  areaServed?: string
  /** Цена «от», числом строкой: "30.00". */
  price?: string
  /** Код валюты ISO 4217: "EUR". */
  priceCurrency?: string
}

export type PageWords = {
  title: string
  description: string
  keywords?: string
  blocks: Block[]
  faq?: FaqPair[]
}

export type TreePage = {
  slug: string
  meta: PageMeta
  en: PageWords
  overrides: Record<string, Partial<PageWords>>
}

const LANG_FILE = /^([a-z]{2})\.json$/

/** Папка элемента: `ELEMENT_DIR` или текущая (см. закон выше). */
export function elementRoot(): string {
  return process.env.ELEMENT_DIR?.trim() || process.cwd()
}

/** Папка ветки внутри `app/[lang]`: `branchDir('(protectedLayer)', 'account')`. */
export function branchDir(...segments: string[]): string {
  return join(/*turbopackIgnore: true*/ elementRoot(), 'app', '[lang]', ...segments)
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T
  } catch {
    return null
  }
}

/** Страница из папки данных; нет `en.json` — страницы нет. */
export function readPageDir(dir: string, slug: string): TreePage | null {
  const en = readJson<PageWords>(join(dir, 'en.json'))
  if (!en) return null
  const meta = readJson<PageMeta>(join(dir, 'meta.json')) ?? {}
  const overrides: Record<string, Partial<PageWords>> = {}
  for (const f of readdirSync(dir)) {
    const m = LANG_FILE.exec(f)
    if (!m || m[1] === 'en') continue
    const words = readJson<Partial<PageWords>>(join(dir, f))
    if (words) overrides[m[1]] = words
  }
  return { slug, meta, en, overrides }
}

/** Корень ветки: `<ветка>/_data/`. */
export function branchRoot(...segments: string[]): TreePage | null {
  return readPageDir(join(branchDir(...segments), '_data'), '')
}

const PART = /^[a-z0-9][a-z0-9-]{0,80}$/

/** Ребёнок ветки по адресу: `<ветка>/_pages/<slug>/`. Имя проверяется формой — путь из него собирается.
 *  402 (владелец 2026-10-05): `slug` бывает путём в два уровня `<папка роли>/<страница>` — `account/_pages/buyer/orders/`. */
export function branchChild(segments: string[], slug: string): TreePage | null {
  const parts = slug.split('/')
  if (parts.length > 2 || !parts.every((p) => PART.test(p))) return null
  const dir = join(branchDir(...segments), '_pages', ...parts)
  return existsSync(dir) && statSync(dir).isDirectory() ? readPageDir(dir, slug) : null
}

/** Все дети ветки по порядку (`meta.order`, затем имя). */
export function branchChildren(...segments: string[]): TreePage[] {
  const pages = join(branchDir(...segments), '_pages')
  if (!existsSync(pages)) return []
  return readdirSync(pages)
    .filter((n) => statSync(join(pages, n)).isDirectory())
    .map((n) => branchChild(segments, n))
    .filter((p): p is TreePage => p !== null)
    .sort((a, b) => (a.meta.order ?? 1e9) - (b.meta.order ?? 1e9) || a.slug.localeCompare(b.slug))
}

/** Слова страницы на языке: перевод поверх английской основы. */
export function wordsIn(page: TreePage, lang: string): PageWords {
  const o = page.overrides[lang] ?? {}
  return {
    title: o.title ?? page.en.title,
    description: o.description ?? page.en.description,
    keywords: o.keywords ?? page.en.keywords ?? '',
    blocks: o.blocks ?? page.en.blocks,
    faq: o.faq ?? page.en.faq,
  }
}
