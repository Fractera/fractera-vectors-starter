import { Fragment } from 'react'
import type { Metadata } from 'next'
import type { WidgetSet } from '@/components/content-page/post-body'
import { notFound } from 'next/navigation'
import { AccessGate } from '@/components/auth/access-gate.client'
import { accessGateUi } from '@/components/auth/access-gate.i18n'
import { appDialogUi } from '@/components/dialog/app-dialog.i18n'
import { createContentPage } from '@/lib/content/create-content-page'
import type { Block } from '@/lib/content/blocks/types'
import { branchChild, branchRoot, wordsIn, type TreePage } from '@/lib/page-tree'
import { ownId } from '@/lib/own-id'
import { brand } from '@/lib/brand'
import { ALL_ROLES, rolesThatSee } from '@/lib/roles'
import { snippetPath } from '@/lib/snippet/page-snippet'

/** 458-3: картинка страницы для соцсетей — её свой сниппет рядом с ней (`<страница>/snippet.png`); своя картинка в `meta.ogImage`
 *  сильнее, а прежняя общая `/og-default.png` больше не подставляется (у публичной страницы всегда есть своя). Закрытые ветки
 *  сниппетов не имеют — им остаётся общая картинка. */
const ogImageOf = (own: string | undefined, segments: string[], subPath: string) =>
  own && own !== '/og-default.png' ? own : isPublic(segments) ? snippetPath(subPath) : '/og-default.png'

// СТРАНИЦЫ ВЕТКИ ИЗ ДЕРЕВА ДАННЫХ (node step 314-2). Два файла маршрута на ветку и больше ни одного: корень
// (`<ветка>/page.tsx` → `rootPage`) и ребёнок (`<ветка>/[slug]/page.tsx` → `childRoute`). Всё остальное — данные.
//
// 🔒 РЕБЁНОК РИСУЕТСЯ ПРИ ПЕРВОМ ЗАХОДЕ И 5 МИНУТ ОТДАЁТСЯ ГОТОВЫМ: `generateStaticParams` пустой (сборка детей не рисует
// вовсе — её время не зависит от числа страниц), `dynamicParams` включён, `revalidate = 300` стоит в файле маршрута.
// 🔒 ЗАМОК РЕБЁНКА — ИЗ ЕГО ДАННЫХ (`meta.roles`) поверх замка ветки в `layout.tsx`; архитектор проходит всегда.

/** Виджеты ветки: имя (`widget-*`) → отрисовка. Список живёт в `<ветка>/_widgets/index.tsx` (владелец 2026-10-07: «удалили
 *  маршрут — проект чистый»); страница ставит виджет в последовательность `blocks` на своё место (423). */
export type { WidgetSet }

/** 423: страница без рамки — только её виджеты, по порядку последовательности. */
function bareWidgets(page: TreePage, lang: string, set: WidgetSet | undefined) {
  return wordsIn(page, lang).blocks
    .filter((b) => b.kind.startsWith('widget-'))
    .map((b, i) => <Fragment key={`${b.kind}-${i}`}>{set?.[b.kind]?.(lang) ?? null}</Fragment>)
}

const ARCHITECT_PAGE = /^\/([a-z]{2})\/architect\/(build\/[a-z-]+)$/

/** Ссылки на страницы ЭТОГО элемента в слое архитектора: в данных без имени, имя — из паспорта при отрисовке. */
function fillElementLinks(blocks: Block[]): Block[] {
  const at = (href: string) => {
    const m = href.match(ARCHITECT_PAGE)
    if (!m) return href
    const id = ownId()
    return id ? `/${m[1]}/architect/${id}/${m[2]}` : '#'
  }
  return blocks.map((b) =>
    b.kind === 'block-hero-centered'
      ? {
          ...b,
          ...(b.cta ? { cta: { ...b.cta, href: at(b.cta.href) } } : {}),
          ...(b.secondary ? { secondary: { ...b.secondary, href: at(b.secondary.href) } } : {}),
        }
      : b,
  )
}

/** Публичная ли ветка: индексируется только `(publicLayer)`; остальные закрыты своим layout. */
const isPublic = (segments: string[]) => segments[0] === '(publicLayer)'

/** 402: роль папки страницы в кабинете — первая папка пути, названная именем роли (`vip-user` → `vip_user`); иначе null.
 *  Только в `(protectedLayer)`: публичная страница с именем `user` не закрывается. */
function folderRole(page: TreePage, segments: string[]): string | null {
  if (segments[0] !== '(protectedLayer)') return null
  const first = page.slug.split('/')[0].replace(/-/g, '_')
  return (ALL_ROLES as readonly string[]).includes(first) ? first : null
}

/** `{roles}` в тексте страницы — список её замка: роль папки и `meta.roles`, каждая со всеми наследниками (402, «роли
 *  наследуются»), плюс архитектор. Один список, два читателя: замок и текст. Нет ни папки роли, ни `meta.roles` — замка нет. */
function allowedRoles(page: TreePage, segments: string[]): string[] | null {
  const own = folderRole(page, segments)
  const base = [...(own ? [own] : []), ...(page.meta.roles ?? [])]
  if (base.length === 0) return null
  const set = new Set(base.flatMap(rolesThatSee))
  set.add('architect')
  return [...set]
}

function contentOf(page: TreePage, lang: string, segments: string[]) {
  const w = wordsIn(page, lang)
  const roles = allowedRoles(page, segments)?.join(', ')
  // `%SITE%` в тексте — имя сайта (соглашение данных; прежний каталог подставлял его сам, блок `p` из «Блоков» — нет).
  // Узел, шаг 450-1: подставляется в КАЖДУЮ строку страницы — заголовок, описание, заголовки секций, lead, h2, пункты списков, FAQ.
  // ✗ До этого — только в `text-p`, и на странице «Cookie» в заголовке так и стояло «%SITE%».
  const site = brand().name
  const fill = <T,>(v: T): T => {
    if (typeof v === 'string') return v.split('%SITE%').join(site) as T
    if (Array.isArray(v)) return v.map(fill) as T
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)])) as T
    return v
  }
  const blocks = fill(fillElementLinks(w.blocks)).map((b) => {
    if (b.kind !== 'text-p' || !roles) return b
    const text = b.text.replace('{roles}', roles)
    return text === b.text ? b : { ...b, text }
  })
  return { title: fill(w.title), description: fill(w.description), keywords: w.keywords ?? '', blocks, faq: fill(w.faq) }
}

type Crumb = { label: string; href?: string }

/**
 * АДРЕС СТРАНИЦЫ ДЛЯ ПОДСВЕТКИ (317-2): обёртка `display: contents` (на вёрстку не влияет) с `data-page` — адрес страницы —
 * и `data-file` — файл данных, из которого нарисован этот язык. Рамка подсветки берёт отсюда «страница · файл», а из
 * блока — его `bid`; этого достаточно, чтобы агент открыл ровно тот абзац.
 */
function PageAddress({ page, file, children }: { page: string; file: string; children: React.ReactNode }) {
  return <div data-page={page} data-file={file} style={{ display: 'contents' }}>{children}</div>
}

function dataFile(tree: TreePage, dir: string[], lang: string): string {
  const name = tree.overrides[lang] ? `${lang}.json` : 'en.json'
  return ['app', '[lang]', ...dir, name].join('/')
}

/**
 * Корень ветки: `segments` — путь папки ветки внутри `app/[lang]`, `subPath` — её адрес без языка.
 * 🔒 Данные читаются при каждой отрисовке, не при загрузке модуля: иначе правка JSON не дошла бы до сайта без перезапуска.
 */
export function rootPage(opts: { segments: string[]; subPath: string; titleInBody?: boolean; crumbs?: boolean; widgets?: WidgetSet }) {
  function build() {
    const page = branchRoot(...opts.segments)
    if (!page) throw new Error(`branch root without _data/en.json: ${opts.segments.join('/')}`)
    return createContentPage({
      data: { overrides: page.overrides },
      // 340-2: закрытые ветки (кабинеты, гость) закрыты от поиска своим layout; страница обязана это знать, иначе печатает
      // набор hreflang, который поисковик не учтёт (сторож: noindex-with-hreflang).
      closedBranch: !isPublic(opts.segments),
      meta: { subPath: opts.subPath, ogImage: ogImageOf(page.meta.ogImage, opts.segments, opts.subPath), service: page.meta.service },
      resolve: (lang) => contentOf(page, lang, opts.segments),
      // 423: виджеты ветки рисуются там, где стоят в последовательности `blocks`.
      widgets: opts.widgets,
      titleInBody: opts.titleInBody,
      chrome: opts.crumbs === false ? undefined : (_lang, c) => ({ breadcrumbs: [{ label: c.title }] }),
    })
  }
  async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    return build().generateMetadata({ params })
  }
  async function Page({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    const tree = branchRoot(...opts.segments)
    // 423: страница без рамки (лендинг) — её виджеты рисуют весь экран сами.
    if (tree?.meta.bare) {
      return (
        <PageAddress page={`/${lang}${opts.subPath}`} file={dataFile(tree, [...opts.segments, '_data'], lang)}>
          <main className="flex-1">{bareWidgets(tree, lang, opts.widgets)}</main>
        </PageAddress>
      )
    }
    const P = build().Page
    return (
      <PageAddress page={`/${lang}${opts.subPath}`} file={tree ? dataFile(tree, [...opts.segments, '_data'], lang) : ''}>
        <P params={Promise.resolve({ lang })} />
      </PageAddress>
    )
  }
  return { generateMetadata, Page }
}

/** Ребёнок ветки: одна страница на все папки `<ветка>/_pages/<slug>/`; 402 — и на `<папка роли>/<страница>` (`[...slug]`). */
type SlugParam = string | string[]
const slugOf = (slug: SlugParam) => (Array.isArray(slug) ? slug.join('/') : slug)

export function childRoute(opts: { segments: string[]; subPath: string; widgets?: WidgetSet }) {
  function build(slug: string) {
    const page = branchChild(opts.segments, slug)
    if (!page) return null
    const root = branchRoot(...opts.segments)
    // 402: страница внутри папки роли — в крошках между корнем ветки и страницей стоит страница роли.
    const parentSlug = slug.includes('/') ? slug.split('/')[0] : null
    const parent = parentSlug ? branchChild(opts.segments, parentSlug) : null
    const factory = createContentPage({
      data: { overrides: page.overrides },
      closedBranch: !isPublic(opts.segments),
      meta: { subPath: `${opts.subPath}/${slug}`, ogImage: ogImageOf(page.meta.ogImage, opts.segments, `${opts.subPath}/${slug}`), service: page.meta.service },
      resolve: (lang) => contentOf(page, lang, opts.segments),
      widgets: opts.widgets,
      chrome: (lang, c) => {
        const crumbs: Crumb[] = []
        if (root && opts.subPath) crumbs.push({ label: wordsIn(root, lang).title, href: `/${lang}${opts.subPath}` })
        if (parent) crumbs.push({ label: wordsIn(parent, lang).title, href: `/${lang}${opts.subPath}/${parentSlug}` })
        crumbs.push({ label: c.title })
        if (parent) return { breadcrumbs: crumbs, backHref: `/${lang}${opts.subPath}/${parentSlug}`, backLabel: wordsIn(parent, lang).title }
        return { breadcrumbs: crumbs, backHref: `/${lang}${opts.subPath}`, backLabel: root ? wordsIn(root, lang).title : undefined }
      },
    })
    return { page, factory }
  }

  async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: SlugParam }> }): Promise<Metadata> {
    const { lang } = await params
    const slug = slugOf((await params).slug)
    const b = build(slug)
    return b ? b.factory.generateMetadata({ params: Promise.resolve({ lang }) }) : {}
  }

  async function Page({ params }: { params: Promise<{ lang: string; slug: SlugParam }> }) {
    const { lang } = await params
    const slug = slugOf((await params).slug)
    const b = build(slug)
    if (!b) notFound()
    // 423: ребёнок без рамки — как корень с `bare`.
    const whole = b.page.meta.bare
    const body = (
      <PageAddress page={`/${lang}${opts.subPath}/${slug}`} file={dataFile(b.page, [...opts.segments, '_pages', slug], lang)}>
        {whole ? <main className="flex-1">{bareWidgets(b.page, lang, opts.widgets)}</main> : <b.factory.Page params={Promise.resolve({ lang })} />}
      </PageAddress>
    )
    const allowed = allowedRoles(b.page, opts.segments)
    if (!allowed) return body
    return (
      <AccessGate roles={allowed} lang={lang} ui={accessGateUi(lang)} dialogUi={appDialogUi(lang)}>
        {body}
      </AccessGate>
    )
  }

  /** Сборка детей не рисует: каждый ребёнок рисуется при первом заходе. */
  function generateStaticParams(): { slug: SlugParam }[] {
    return []
  }

  return { generateMetadata, Page, generateStaticParams }
}
