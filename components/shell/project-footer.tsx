import Link from "next/link"
import { Boxes } from "lucide-react"
import type { ShellData, ShellSurface } from "./shell-types"
import { isAbsolute, shellHref } from "./shell-href"
import { findSocialIcon } from "./socials"
import { AppWidthToggle, FooterSocialDropdown, ThemeToggle } from "./shell-toggles.client"
import { LanguageSwitcher } from "./language-switcher.client"

// ПОДВАЛ ПРОЕКТА — ОДИН У САЙТА, ВХОДА, ЯДРА И КАЖДОЙ НОВОЙ СЛУЖБЫ (285-3). Вид перенесён из подвала сайта
// (`components/menu/footer/footer-menu.server.tsx`) без изменений: страницы подвала (когда архитектор включил
// их в панели — страницы публичные, закон к ним тот же, что к обычному сайту), имя проекта ссылкой в корень
// проекта, адрес, соцсети, ширина, тема, язык. Переключатели пишут выбор в cookie проекта — на все страницы.
//
// 🔒 ПОДВАЛ ПЕРЕКЛЮЧАТЕЛЮ ШИРИНЫ НЕ ПОДЧИНЯЕТСЯ (2026-08-15): он мебель и занимает всю ширину, как шапка.
export function ProjectFooter({ data, surface = {} }: { data: ShellData; surface?: ShellSurface }) {
  const { lang, words, toggles } = data
  const languages = surface.languages ? data.languages.filter((l) => surface.languages!.includes(l.code)) : data.languages
  const langSwitch = toggles.language ? <LanguageSwitcher languages={languages} regions={data.regions} defaultLang={data.defaultLang} /> : null
  const theme = toggles.theme ? <ThemeToggle labels={{ system: words.system, light: words.light, dark: words.dark }} /> : null
  const home = isAbsolute(data.home) ? (
    <a href={data.home} className="hover:text-primary transition-colors">{data.brand}</a>
  ) : (
    <Link href={data.home} className="hover:text-primary transition-colors">{data.brand}</Link>
  )

  return (
    <footer className="border-t border-border bg-background text-foreground mt-auto" data-project-footer>
      <div className="px-6 py-6 flex flex-col gap-6">
        {data.footer.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">{words.footerPages}</p>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground font-medium">
              {data.footer.map((g) => {
                const href = shellHref(lang, g.href, `/${lang}/${g.slug}`)
                return isAbsolute(href) ? (
                  <a key={g.slug} href={href} className="hover:text-primary transition-colors">{g.label}</a>
                ) : (
                  <Link key={g.slug} href={href} className="hover:text-primary transition-colors">{g.label}</Link>
                )
              })}
            </nav>
          </div>
        )}

        {/* © + имя слева, переключатели справа — одна строка на любой ширине. Телефон: без «rights», порядок
            тема · язык · соцсети (крайняя справа, открывается вверх). */}
        <div className="flex flex-row items-center justify-between gap-3 text-sm">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="truncate">
              © {new Date().getFullYear()} {home}.<span className="hidden sm:inline"> {words.rights}</span>
            </span>
            {data.address && <span className="text-xs text-muted-foreground truncate">{data.address}</span>}
          </div>

          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {data.socials.map(({ href, label, icon }) => {
              const uploaded = /^(\/|https?:)/.test(icon)
              const Icon = uploaded ? null : findSocialIcon(icon) ?? Boxes
              return (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="size-8 inline-flex items-center justify-center rounded-md border border-border text-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {Icon ? (
                    <Icon className="size-4" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={icon} alt="" aria-hidden className="size-4" />
                  )}
                </a>
              )
            })}
            {toggles.width && <AppWidthToggle labels={{ wide: words.wide, normal: words.normal }} />}
            {theme}
            {langSwitch}
          </div>

          <div className="flex sm:hidden items-center gap-2 shrink-0">
            {theme}
            {langSwitch}
            <FooterSocialDropdown socials={data.socials} label={words.social} />
          </div>
        </div>
      </div>
    </footer>
  )
}
