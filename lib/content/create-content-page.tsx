import type { Metadata } from 'next'
import type { ServiceMeta } from '@/lib/page-tree'
import type { ReactNode } from 'react'
import type { Block, FaqPair } from '@/lib/content/blocks/types'
import { buildAlternates } from '@/lib/seo/alternates'
import { alternatesLanguages, isIndexable, type TranslatedPage } from '@/lib/seo/translation-state'
import { author, authorSameAs } from '@/lib/author'
import { brand } from '@/lib/brand'
import { StandardContentPage, type Breadcrumb } from '@/components/content-page/standard-content-page'
import { featureOn } from '@/config/platform-config'

// ─────────────────────────────────────────────────────────────────────────────
// createContentPage — the page factory. It turns a content descriptor into a
// complete, fully-static Block-3 page: `generateMetadata` (title/desc/keywords/
// hreflang/OpenGraph) + JSON-LD (Article/BreadcrumbList/FAQPage, author=Person)
// + the StandardContentPage chrome. A new route becomes a ~10-line file that
// supplies data only; all the boilerplate lives here.
//
// The i18n layer is untouched: `resolve(lang)` is the existing per-document
// resolver (e.g. deploymentContent over a route's co-located ./_data folder)
// built on resolveEntry with EN-fallback. The factory never reads or changes any
// localized content file.
// ─────────────────────────────────────────────────────────────────────────────

// Brand-derived origin — sourced from env via lib/brand (white-label/portable).
const SITE = brand().siteUrl

/** Shape returned by a per-document resolver — the localized page descriptor. */
// 🔒 В СТРУКТУРИРОВАННЫЕ ДАННЫЕ ОТВЕТ ЕДЕТ БЕЗ РАЗМЕТКИ (2026-08-29, шаг 38).
// С этого дня ответ FAQ может нести ссылку (`sections/blocks/faq.server.tsx`
// разбирает `[подпись](адрес)`), а `FAQPage` поисковик читает ДОСЛОВНО — и
// напечатал бы квадратные скобки в выдаче. Снимаем разметку здесь, а не в
// словах: словам ссылка нужна, поисковику — нет.
function plainAnswer(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1')
}

export type ContentPageContent = {
  title: string // H1
  seoTitle?: string
  subtitle?: string
  description: string
  keywords: string
  blocks: Block[]
  faq?: FaqPair[]
}

/** Page-specific, localized chrome (breadcrumb trail + back link). */
export type ContentPageChrome = {
  breadcrumbs?: Breadcrumb[]
  backHref?: string
  backLabel?: string
}

export type ContentPageConfig<C extends ContentPageContent> = {
  /** Per-document, per-language resolver (resolveEntry-based). */
  resolve: (lang: string) => C
  /**
   * Данные страницы — ради одного вопроса: на каких языках у неё есть СВОЙ текст
   * (256-6, `lib/seo/translation-state.ts`).
   *
   * 🔒 ПОЛЕ ОБЯЗАТЕЛЬНОЕ, И ЭТО РЕШЕНИЕ, А НЕ НЕДОСМОТР. Из него строится набор
   * `hreflang`; «забытое» поле означало бы, что страница объявляет переводом
   * каждый включённый язык — включая тот, где отдаётся английская основа. Набор
   * почти одинаковых адресов, обещанных поисковику, и есть дорвей. Обязательность
   * переносит эту ошибку из «просевшей выдачи через месяцы» в красный `tsc`.
   *
   * Передаётся тот же объект `data`, что уже лежит рядом в каждом маршруте.
   */
  data: TranslatedPage
  /**
   * Страница-копия чужого текста — не индексируется ни на одном языке (261).
   *
   * 🔒 ЗАЧЕМ: владелец 2026-09-21 поставил в меню страницы, которые пока
   * показывают чужое содержимое (Core — главную, WEB3 — WEB4), «пока у нас нет
   * контента». Два адреса с одним текстом поисковик читает как дубль и понижает
   * оба. Свой текст появился — признак снимается, и страница входит в выдачу.
   */
  noindex?: boolean
  /**
   * Страница закрытой ветки (кабинеты, гость; шаг 340-2): её robots задаёт layout ветки, а страница не объявляет переводов —
   * набор hreflang закрытой страницы поисковик не учитывает (сторож `check-seo-html`: noindex-with-hreflang).
   */
  closedBranch?: boolean
  /**
   * Крошки и ссылка «назад». НЕОБЯЗАТЕЛЬНЫ (шаг 508).
   *
   * 🔒 ПОЧЕМУ ЭТО ВАЖНЕЕ, ЧЕМ ВЫГЛЯДИТ. Ровно эта обязательность была
   * единственным, что мешало главной идти через ту же фабрику, что посты и
   * правовые страницы, — и едва не стала поводом завести вторую фабрику «для
   * лендингов». Из пятнадцати свойств шаблона четырнадцать уже исчезали сами,
   * когда их не дают; обязательность оставшихся была свойством кода, а не
   * устройства страницы. Второй стандарт на ровном месте — начало четвёртого.
   */
  chrome?: (lang: string, content: C) => ContentPageChrome
  /** Non-translatable per-page fields. */
  meta: {
    subPath: string
    ogImage: string
    heroImage?: string
    tags?: readonly string[]
    /** 431: страница-услуга (`meta.json` → `service`) — разметка `Service` вместо `Article`. */
    service?: ServiceMeta
  }
  /** Structured-data type for the primary entity. Defaults to 'Article'. */
  jsonLdType?: 'Article' | 'NewsArticle'
  /**
   * Заголовок печатает материал страницы, а не её шапка (лендинг).
   *
   * Нужен ровно тем страницам, чей первый экран — сетка: секция `heroSplit`
   * ставит H1 в левую колонку рядом с описанием, и шапка обязана свой заголовок
   * не печатать, иначе H1 на странице два. Метаданные, `og:title` и разметка
   * строятся здесь и от этого признака не зависят — фабрика по-прежнему получает
   * `title` из материала.
   */
  titleInBody?: boolean
  /**
   * Optional sections injected into the block, directly ABOVE the FAQ (architect
   * discretion — e.g. the sponsorship section). The factory bakes in nothing
   * here; the route entry decides what to pass. May render one section, several,
   * or none. The FAQ stays last by contract.
   */
  sections?: (lang: string) => ReactNode
  /**
   * Виджет маршрута, встающий сразу ЗА первым экраном — во всю ширину, вне ленты
   * (шаг 521, статический виджет главной).
   *
   * Отличие от `hero` ниже: тот заменяет картинку ВНУТРИ ленты, этот рисуется
   * снаружи, между первым экраном и текстом. Фабрика сюда ничего не запекает —
   * что показать, решает вход маршрута.
   */
  afterHero?: (lang: string) => ReactNode
  /** Разметка между шапкой и оглавлением — верхняя часть страницы (231-1). */
  afterHeader?: (lang: string) => ReactNode
  /** Разметка после тела: слот появился в 69 ради кнопки заявки под заглушкой. */
  afterBody?: (lang: string) => ReactNode
  /**
   * Optional hero override, rendered directly under the H1 in place of the default
   * `meta.heroImage` figure (e.g. the MCP step-by-step carousel at the top of
   * /deployments/mcp). When provided, `meta.heroImage` is ignored.
   */
  hero?: (lang: string) => ReactNode
  /** 423: виджеты ветки для `widget-*` в последовательности страницы (`<ветка>/_widgets/index.tsx`). */
  widgets?: Record<string, (lang: string) => ReactNode>
}

function abs(path: string): string {
  return /^https?:/.test(path) ? path : `${SITE}${path}`
}

export function createContentPage<C extends ContentPageContent>(config: ContentPageConfig<C>) {
  const { resolve, chrome, meta, jsonLdType = 'Article', sections, hero, afterHero, afterHeader, afterBody, widgets, titleInBody = false } = config

  async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    const c = resolve(lang)
    const seoTitle = c.seoTitle ?? c.title
    // Social snippet image MUST be an absolute URL — Telegram/Facebook/LinkedIn
    // scrapers ignore relative og:image paths. (JSON-LD below already uses abs().)
    const ogImageUrl = abs(meta.ogImage.replace('{lang}', lang))
    return {
      // `absolute` по той же причине, что и у поста: корневой шаблон
      // `%s | <имя сайта>` иначе добавит имя второй раз.
      // 🔒 ПУСТОЙ ЗАГОЛОВОК — ЗАКОННОЕ СОСТОЯНИЕ СТРАНИЦЫ, А НЕ ОШИБКА ДАННЫХ
      // (230-6, 2026-09-18). Страница без заголовка бывает: главная, у которой
      // содержимого пока нет вовсе. Прежняя склейка давала при этом `<title> |
      // Fractera</title>` — вид испорченной разметки, по которому поисковик судит
      // о качестве сайта. Пусто → остаётся одно имя сайта.
      title: { absolute: seoTitle ? `${seoTitle} | ${brand().name}` : brand().name },
      description: c.description,
      keywords: c.keywords,
      alternates: buildAlternates(lang, meta.subPath, config.noindex || config.closedBranch ? [] : alternatesLanguages(lang, config.data)),
      // 🔒 НЕПЕРЕВЕДЁННАЯ ВЕРСИЯ НЕ ИНДЕКСИРУЕТСЯ (256-6), и здесь это сказано
      // ЯВНО, хотя раньше `robots` страница вовсе не объявляла и наследовала его
      // от корня. Наследование — ровно то, из-за чего непереведённый адрес
      // получал `index, follow` вместе со всеми: правило, которого нет, читается
      // как разрешение.
      //
      // 🛑 `index: false` НЕ ОТМЕНЯЕТ ПОКАЗ. Человек открывает страницу и видит
      // английский текст; невидима она только для поисковика. Правило о том, что
      // ПОКАЗЫВАТЬ, и правило о том, что ОБЕЩАТЬ машине, — разные, и смешение их
      // дало бы 404 там, где нужен просто честный сигнал.
      ...(config.closedBranch || (!config.noindex && isIndexable(lang, config.data)) ? {} : { robots: { index: false, follow: true } }),
      openGraph: {
        // 431: главная — сайт, а не статья; страница-услуга — тоже не статья. Остальные страницы — статьи.
        type: meta.subPath === '' || meta.service ? 'website' : 'article',
        url: `${SITE}/${lang}${meta.subPath}`,
        siteName: brand().name,
        title: seoTitle,
        description: c.description,
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: c.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: seoTitle,
        description: c.description,
        images: [ogImageUrl],
      },
    }
  }

  async function Page({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    const c = resolve(lang)
    const { breadcrumbs, backHref, backLabel } = chrome?.(lang, c) ?? {}
    const url = `${SITE}/${lang}${meta.subPath}`
    const ogImageUrl = abs(meta.ogImage.replace('{lang}', lang))


    // 🔒 ВЫКЛЮЧАТЕЛЬ FAQ БЫЛ МЁРТВЫМ (шаг 522, 2026-08-20). Панель его предлагала,
    // конфиг хранил, а страница рисовала вопросы всегда: проверено браузером —
    // при `faq: false` на живом сервере стояли и блок «Frequently asked questions»,
    // и разметка `FAQPage`.
    //
    // 🔒 ГЕЙТ У ИСТОЧНИКА, А НЕ У ДВУХ ПОТРЕБИТЕЛЕЙ. Вопросы уходят в ДВА места —
    // видимый блок и структурированные данные. Закрыть только видимое значит
    // пообещать машине то, чего на странице нет; закрывать оба по отдельности —
    // оставить третье место следующему, кто добавит потребителя. Гасится массив:
    // оба потребителя уже проверяют его длину.
    const faq = featureOn("faq") ? c.faq : undefined

    const jsonLd: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': jsonLdType,
        headline: c.title,
        description: c.description,
        inLanguage: lang,
        author: {
          '@type': 'Person',
          '@id': author().id,
          name: author().name,
          url: author().url,
          sameAs: authorSameAs(),
        },
        publisher: {
          '@type': 'Organization',
          name: brand().legalName,
          url: SITE,
          logo: { '@type': 'ImageObject', url: brand().logoUrl },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        keywords: c.keywords,
        image: ogImageUrl,
      },
      // 🪦 РАЗМЕТКА КРОШЕК УДАЛЕНА ОТСЮДА 2026-08-15 — ОНА БЫЛА ВТОРОЙ.
      //
      // Здесь строился `BreadcrumbList`, и точно такой же строит компонент самих
      // крошек (`components/nav/breadcrumbs.server.tsx`). С переходом шапки на
      // общий примитив обе оказались бы на одной странице: поисковик получил бы
      // два объявления пути, а расходиться они начали бы с первой правки — тихо,
      // потому что вторую разметку в браузере никто не видит.
      //
      // Осталась одна, и она стоит там же, где НАРИСОВАННЫЙ путь: объявленное
      // поисковику и показанное человеку обязаны совпадать по построению, а не
      // по внимательности того, кто правит.
      // 🪦 314-2: разметку `FAQPage` ставит сам блок `faq` из «Блоков» рядом с видимыми вопросами; здесь она была бы второй.
    ]

    // 431: страница-услуга — главная сущность `Service` (название и описание — её слова на её языке), а не `Article`.
    if (meta.service) {
      const s = meta.service
      jsonLd[0] = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: c.title,
        description: c.description,
        url,
        provider: { '@type': 'Organization', name: s.provider || brand().name, url: SITE },
        ...(s.areaServed ? { areaServed: { '@type': 'Place', name: s.areaServed } } : {}),
        ...(s.price && s.priceCurrency ? { offers: { '@type': 'Offer', price: s.price, priceCurrency: s.priceCurrency, url } } : {}),
        image: ogImageUrl,
      }
    }

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <StandardContentPage
          lang={lang}
          breadcrumbs={breadcrumbs}
          tags={meta.tags ? [...meta.tags] : undefined}
          title={c.title}
          subtitle={c.subtitle}
          titleInBody={titleInBody}
          heroImage={meta.heroImage}
          heroAlt={c.title}
          hero={hero?.(lang)}
          afterHero={afterHero?.(lang)}
          afterHeader={afterHeader?.(lang)}
          afterBody={afterBody?.(lang)}
          blocks={c.blocks}
          widgets={widgets}
          faq={faq}
          backHref={backHref}
          backLabel={backLabel}
          sections={sections?.(lang)}
        />
      </>
    )
  }

  return { generateMetadata, Page }
}
