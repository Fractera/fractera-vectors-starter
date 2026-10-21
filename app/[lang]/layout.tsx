import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/theme-provider.client";
import { ThemeInit } from "@/components/theme-init";
import { AppWidthInit } from "@/components/app-width-init";
import { buildDesignCss } from "@/lib/design-css";
import { DrawerProvider } from "@/providers/drawer-provider.client";
import { TopMenu } from "@/components/menu/top/top-menu.server";
import { FooterMenu } from "@/components/menu/footer/footer-menu.server";
import { StarterBanner } from "@/components/shell/starter-banner.client";
import { starterBannerStrings } from "@/components/shell/starter-banner.i18n";
import { ownId } from "@/lib/own-id";
import { DrawerMenu } from "@/components/menu/drawer/drawer-menu.server";
import { ViewportBadge } from "@/components/dev/viewport-badge.client";
import { viewportBadgeWords } from "@/components/dev/viewport-badge.i18n";
import { designSkill } from "@/lib/design-skill";
import { bodyFontClass } from "@/lib/fonts";
import { getAppConfig } from "@/config/app-config";
import { constructMetadata } from "@/lib/construct-metadata";
import { buildOrganizationSchema, buildWebSiteSchema, buildLocalBusinessSchema } from "@/lib/jsonld";
import { SUPPORTED_LANGUAGES } from "@/config/translations/translations.config";
import { readBannerConfig } from "./_components/cookie-banner/banner-config";
import { CookieBanner } from "./_components/cookie-banner/cookie-banner.client";
import { bannerUi } from "./_components/cookie-banner/cookie-banner.i18n";
import { featureOn } from "@/config/platform-config";
import { RegisterServiceWorker } from "@/components/pwa/register-sw.client";
import { InstallPrompt } from "@/components/pwa/install-prompt.client";
import { installUi } from "@/components/pwa/install-prompt.i18n";
import { IosSplash } from "@/components/pwa/ios-splash";
import { SignInNotice, SIGN_IN_TOASTER } from "@/components/auth/sign-in-notice.client";
import { signInNoticeStrings } from "@/components/auth/sign-in-notice.i18n";
import { BlockHighlight } from "@/components/block-highlight/block-highlight.client";
import { blockHighlightWords } from "@/components/block-highlight/block-highlight.i18n";
import { TaskReport } from "@/components/task-report/task-report.client";
import { appDialogUi } from "@/components/dialog/app-dialog.i18n";
import { taskReportWords } from "@/components/task-report/task-report.i18n";
import { needsCookieBanner } from "@/lib/policy-tools";

// Root layout for the localized public surface (step 131). This zone OWNS <html>/
// <body> — the language comes from the [lang] route param (known at build), NOT from
// a single config value in the bare root (the old anti-pattern that locked
// <html lang="en"> for every language). The lang param is VALIDATED before use
// (22slots rule: always validate the segment, never just trust it). Static-first:
// generateStaticParams enumerates the languages, the subtree is ISR (revalidate),
// and NO dynamic function (headers()/cookies()/auth()) is called here — so the whole
// [lang] tree stays statically prerendered. See workspace-standards/static-first.md.
export const revalidate = 600;

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((lang) => ({ lang }));
}

// Язык страницы передаётся в сборку меты (шаг 501): без него `constructMetadata`
// брала название, описание, шаблон заголовка, ключевые слова и имя сайта ОДНИМ
// набором на все языки — и испанская страница объявляла себя англоязычной.
export async function generateMetadata(
  { params }: { params: Promise<{ lang: string }> },
): Promise<Metadata> {
  const { lang } = await params;
  return {
    ...constructMetadata({ lang }),
    // Манифест — СВОЙ на каждый язык (шаг 504). Установленное приложение
    // подписано на домашнем экране именем отсюда и открывается с его
    // `start_url`; общий манифест ставил всем английское имя и английскую
    // главную, а переименовать значок пользователь уже не сможет.
    manifest: `/${lang}/manifest.webmanifest`,
  };
}

export function generateViewport(): Viewport {
  const cfg = getAppConfig();
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: cfg.themeColors.light },
      { media: "(prefers-color-scheme: dark)", color: cfg.themeColors.dark },
    ],
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  // Validate the route param before it reaches <html lang> (never trust the segment).
  if (!SUPPORTED_LANGUAGES.includes(lang)) notFound();

  const cfg = getAppConfig();
  // Cookie-banner strings for this language (step 305) — merged config over the shipped default.
  const banner = readBannerConfig();
  // Слова баннера: СВОИ на 82 языках, поверх них — то, что владелец изменил в
  // панели. Порядок именно такой: пустая настройка не имеет права оставить
  // баннер без текста, а он делит сообщение по метке ссылки и упал бы.
  // Analytics on → the banner is on too (owner 2026-10-11: «if need cookie banner for it, you must activate it in start add
  // GA»): Google Analytics sets cookies, so a visitor is asked first. Search Console needs no banner — it is a meta tag.
  const bannerOn = featureOn("cookieBanner") || needsCookieBanner(cfg);
  // Копия сайта на устройстве посетителя — решение владельца, а не наше
  // умолчание (2026-08-13). Выключенный режим не просто «не регистрируем»: он
  // СНИМАЕТ воркер и стирает кеши у тех, кому он уже достался.
  const offlineOn = featureOn("offlineCache");
  const bannerStrings = { ...bannerUi(lang), ...(banner.languages[lang] ?? {}) };
  const ld: Record<string, unknown>[] = [];
  if (cfg.jsonLd.website) ld.push(buildWebSiteSchema(cfg));
  if (cfg.jsonLd.organization) ld.push(buildOrganizationSchema(cfg));
  if (cfg.jsonLd.localBusiness) {
    const lb = buildLocalBusinessSchema(cfg);
    if (lb) ld.push(lb);
  }

  const gaId = cfg.analytics.enabled ? cfg.analytics.googleAnalyticsId : undefined;

  // Оформление владельца: правила перекрытия и адреса внешних шрифтов.
  const { css: designCss, fontLinks: designFontLinks } = buildDesignCss();

  return (
    <html lang={lang} suppressHydrationWarning className="scroll-smooth">
      <head>
        <meta name="generator" content="Fractera" />

        {/* ОФОРМЛЕНИЕ ВЛАДЕЛЬЦА — перекрытие темы проекта (шаг «Дизайн», 2026-08-15).
            Цвета, шрифты, шкала текста и формы приходят из
            `DESIGN-CONFIG/design-config.json`, который пишет панель управления.
            Ничего не настроено — здесь пусто, и действует тема проекта.

            🔒 СТОИТ ПЕРВЫМ В ШАПКЕ И ДО ГЛОБАЛЬНЫХ СТИЛЕЙ НЕ ПОДНИМАЕТСЯ: правила
            перекрывают тему по порядку следования, а не по важности, поэтому
            блок обязан идти ПОСЛЕ файла темы (его подключает сборка) и внутри
            `<head>` — иначе браузер применит его до того, как тема загружена,
            и перекрытие пропадёт. */}
        {designCss && <style dangerouslySetInnerHTML={{ __html: designCss }} />}
        {designFontLinks.map(href => (
          <link key={href} rel="stylesheet" href={href} />
        ))}

        <ThemeInit />
        {/* Заставки iOS: без них Safari рисует при запуске установленного
            приложения белый экран — на тёмной теме это выглядит поломкой. */}
        <IosSplash />
        <AppWidthInit />
        {ld.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {/* Consent Mode v2: denied until the visitor accepts in the banner; an earlier choice (localStorage
                  `fractera-cookie-consent`, written by the banner) is applied before the first hit. */}
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}var c=null;try{c=localStorage.getItem('fractera-cookie-consent')}catch(e){}var g=c==='accepted'?'granted':'denied';gtag('consent','default',{analytics_storage:g,ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
      </head>
      <body className={`${bodyFontClass} min-h-screen flex flex-col`}>
        <ThemeProvider>
          {/* Always-present menu shell (step 160): each menu renders nothing until a
              group enables its slot. DrawerProvider shares the left/right open state
              between the header toggle icons and the drawer panels (sub-step 3).
              Footer is always present (site furniture + theme/language). */}
          <DrawerProvider>
            <TopMenu lang={lang} />
            {/* 🔒 ПОЛОСА-ПОДСКАЗКА НА ВСЕХ СТРАНИЦАХ — решение владельца
                2026-09-20: «этот нотификейшн должен быть на всех страницах».
                Прежде она жила только на главной, то есть человек, пришедший по
                ссылке на любую другую страницу, не узнавал, что смотрит чужой
                шаблон.

                🔒 МЕСТО ВЫБРАНО НЕ СЛУЧАЙНО: сразу под шапкой, потому что полоса
                позиционируется от её нижней границы (`top-14`). Соседство в
                разметке повторяет соседство на экране — иначе связь двух чисел
                видна только тому, кто читал оба файла.

                🔒 СТАТИКУ НЕ ЛОМАЕТ: это островок, слушатель прокрутки живёт
                внутри него, а макет остаётся серверным и ничего не спрашивает. */}
            {/* 542 (владелец 2026-10-19): жёлтая вывеска стартера — та же, что у root («единственное что мы оставляем это выпадающее
                жёлтая вывеска»); выезжает сразу, ссылка ведёт на «Подписку Claude Code» этого элемента в ядре. 🪦 314-2 её снимал. */}
            <StarterBanner strings={starterBannerStrings(lang)} lang={lang} dropOnLoad href={process.env.ARCHITECT_URL && ownId() ? `${process.env.ARCHITECT_URL.replace(/\/+$/, "")}/${lang}/${ownId()}/build/subscription` : undefined} />
            {children}
            <FooterMenu lang={lang} />
            {/* Left & right slide-in drawers (shadcn Sheet), controlled by the same
                DrawerProvider state as the header toggle icons; each renders nothing
                until a group enables its side's slot. */}
            <DrawerMenu side="left" lang={lang} />
            <DrawerMenu side="right" lang={lang} />
            {/* Индикатор ширины экрана — только в разработке; в боевой сборке
                компонент вырезается целиком (см. его файл), а не прячется. */}
            {/* 🔒 ИНДИКАТОР ШИРИНЫ ПОДЧИНЁН ВЫКЛЮЧАТЕЛЮ (шаг 41, 2026-08-29).
                Прежде он рисовался всегда, и выключить его можно было только
                правкой кода — то есть никак, если проект уже у клиента. Теперь
                это возможность проекта, включённая по умолчанию, и её положение
                человек меняет на `/{lang}/architect/design?section=tools`.

                🔒 ПРОВЕРКА ЗДЕСЬ, А НЕ ВНУТРИ ЗНАЧКА: `featureOn` читает конфиг
                на сервере, а значок — островок. Спроси он сам — конфиг уехал бы
                в браузер вместе с ним. */}
            {featureOn("viewportBadge") && <ViewportBadge skill={designSkill()} closeLabel={viewportBadgeWords(lang).close} />}
            {/* Cookie-consent banner (step 305) — on every public page via this layout. Strings are
                server-provided per language (readBannerConfig, ISR) so anonymous visitors get a fully
                localized banner without hitting the gated /api. */}
            {/* Выключатель панели решает, есть ли баннер вообще. До 2026-08-12
                он не проверялся: баннер показывался всегда, а переключатель в
                панели не значил ничего. */}
            {bannerOn && <CookieBanner lang={lang} strings={bannerStrings} />}
            <Toaster position="bottom-right" richColors closeButton />
            {/* 260-3: плашка «вы вошли» — сверху, своим контейнером, как просил владелец. */}
            <Toaster id={SIGN_IN_TOASTER} position="top-center" richColors closeButton />
            <SignInNotice strings={signInNoticeStrings(lang)} />
            {/* Сервис-воркер: офлайн для уже виденных страниц и мгновенное
                повторное открытие. Стратегия — сеть первой для страниц, поэтому
                устаревшая страница невозможна (см. public/sw.js). */}
            <RegisterServiceWorker enabled={offlineOn} />
            {/* Предложение установить приложение. Слова резолвятся на СЕРВЕРЕ и
                едут пропсом: словарь на 82 языка не имеет права оказаться в
                браузере. Кнопка появляется, только когда браузер сам сообщил,
                что сайт устанавливаем. */}
            <InstallPrompt strings={installUi(lang)} />
            {/* 317-3: подсветка блоков — спит, пока Preview ядра не включит её сообщением (только свой источник). */}
            <BlockHighlight words={blockHighlightWords(lang)} />
            {/* 356-2: окно отчёта о задаче — только ?report= на этой машине (предпросмотр); иначе ничего не рисует. */}
            <TaskReport words={taskReportWords(lang)} dialogUi={appDialogUi(lang)} />
          </DrawerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
