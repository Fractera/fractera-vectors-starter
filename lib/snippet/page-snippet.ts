import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { renderSnippet } from './render.mjs'
import { elementRoot } from '@/lib/page-tree'

// СНИППЕТ СТРАНИЦЫ — АДРЕС РЯДОМ СО СТРАНИЦЕЙ (шаг узла 458-3). Выбор владельца 2026-10-12: «Картинка рядом со страницей» —
// сниппет рисуется при ПЕРВОМ запросе (заход человека или робота соцсети), хранится в кэше как статический ответ и
// перерисовывается вместе со страницей; пересборка не нужна, адрес постоянный: `/<язык>/<путь>/snippet.png`.
// Маршрут лежит рядом со страницей, как её Markdown-двойник `index.md`: `<папка страницы>/snippet.png/route.ts`.
//
// Фон — файл проекта `public/images/snippet/background.webp` (его создаёт навык `page-snippet` по описанию заказчика);
// файла нет — узор в цвете дизайна. Цвета — DESIGN-CONFIG элемента.

export const SNIPPET_BACKGROUND = path.join('public', 'images', 'snippet', 'background.webp')

/** Адрес сниппета страницы: `{lang}` подставляет фабрика страницы (`meta.ogImage`). */
export function snippetPath(subPath: string): string {
  return `/{lang}${subPath}/snippet.png`
}

/** Ответ PNG для маршрута `snippet.png`. Пустой заголовок — 404: картинка без слов хуже общей картинки сайта. */
export async function snippetResponse(title: string, description: string): Promise<Response> {
  if (!title.trim()) return new Response('Not found', { status: 404 })
  const root = elementRoot()
  const bg = path.join(root, SNIPPET_BACKGROUND)
  const png = await renderSnippet({ title, description, background: fs.existsSync(bg) ? bg : null, root })
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400' },
  })
}

/** `%SITE%` в словах страницы — имя сайта (то же соглашение, что у страницы: lib/branch-page.tsx contentOf). */
export function fillSite(text: string | undefined, site: string): string {
  return (text ?? '').split('%SITE%').join(site)
}
