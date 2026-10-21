import "server-only"
import { getAppConfig } from "@/config/app-config"
import { resolveSocialLinks, socialHref } from "@/config/app-config.defaults"
import { featureOn } from "@/config/platform-config"
import { getAvailableLanguages, DEFAULT_LANGUAGE } from "@/config/translations/translations.config"
import { LANGUAGE_REGIONS } from "@/config/translations/language-metadata"
import { isUploadedIcon } from "@/lib/socials/catalogue"
import { resolveTopGroups, resolveFooterGroups } from "@/lib/menu/site-menu"
import { accountLinks } from "@/lib/menu/account-links"
import { appShellAuthSide } from "@/components/menu/account/account-config"
import { accountLabels } from "@/components/menu/account/account-menu.i18n"
import { topMenuUi } from "@/components/menu/top/top-menu.i18n"
import { footerLabels, widthLabels } from "@/components/menu/footer/footer-menu.i18n"
import type { ShellData } from "@/components/shell/shell-types"

// ДАННЫЕ ОБОЛОЧКИ ПРОЕКТА ИЗ НАСТРОЕК САЙТА (шаг 285-3).
//
// 🔒 ОДНА ФУНКЦИЯ ДЛЯ ДВУХ ПОТРЕБИТЕЛЕЙ: шапка и подвал самого сайта рисуют из неё, и она же отдаётся всем
// службам статической дверью `/api/shell/<язык>`. Две сборки одних и тех же данных разошлись бы в первый же
// день правки — ровно это и дало «калейдоскоп» до 285.
//
// 🔒 АДРЕСА — ОТНОСИТЕЛЬНЫЕ САЙТУ (`/m2m`, `/ru/architect`): служба, рисующая оболочку у себя, делает их
// абсолютными на адрес сайта (`absolutize` в её клиенте двери).
export function siteShellData(lang: string): ShellData {
  const cfg = getAppConfig()
  const side = appShellAuthSide()
  const acc = accountLabels(lang)
  const ui = footerLabels(lang)
  const width = widthLabels(lang)
  const languages = getAvailableLanguages()

  const socials = featureOn("socials")
    ? resolveSocialLinks(cfg.seo).map((link) => {
        const uploaded = isUploadedIcon(link.icon)
        // Ключ значка: загруженная картинка → её адрес; иначе явно выбранный ключ → историческое имя из `id`.
        return { href: socialHref(link), label: link.name, icon: uploaded ? (link.icon as string) : (link.icon || link.id) }
      })
    : []

  return {
    lang,
    brand: cfg.short_name ?? "",
    logo: cfg.logo || null,
    home: `/${lang}`,
    menuOn: featureOn("topMenu"),
    top: resolveTopGroups(lang),
    footer: resolveFooterGroups(lang),
    account: side
      ? {
          side,
          labels: { signIn: acc.signIn, account: acc.account, signOut: acc.signOut },
          links: accountLinks(lang).map((l) => ({ href: l.href, label: l.label, ...(l.roles ? { roles: [...l.roles] } : {}) })),
        }
      : null,
    toggles: { theme: featureOn("themeToggle"), width: featureOn("widthToggle"), language: featureOn("languageSwitcher") },
    words: {
      menu: topMenuUi(lang).menu,
      footerPages: ui.footerPages,
      rights: ui.rights,
      system: ui.system,
      light: ui.light,
      dark: ui.dark,
      social: ui.social,
      wide: width.wide,
      normal: width.normal,
    },
    socials,
    address: cfg.geo?.address || null,
    languages: languages.map((l) => ({
      code: l.code,
      nativeName: l.nativeName,
      englishName: l.englishName,
      flag: l.flag,
      regions: [...l.regions],
      ...(l.regionFlags ? { regionFlags: { ...(l.regionFlags as Record<string, string>) } } : {}),
    })),
    regions: [...LANGUAGE_REGIONS],
    defaultLang: DEFAULT_LANGUAGE,
  }
}
