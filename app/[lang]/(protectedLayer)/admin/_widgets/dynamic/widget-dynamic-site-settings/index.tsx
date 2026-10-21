import { SettingsEditorIsland } from "./settings-editor.client"
import { LanguagesIsland } from "./languages-island.client"
import { fieldsUi } from "./fields.i18n"
import { groupsUi } from "./groups.i18n"
import { searchLanguagesWords } from "./search-languages.i18n"
import { siteSettingsWords } from "./site-settings.i18n"
import { ALL_LANGUAGE_METADATA } from "@/lib/site-settings/language-metadata"
import { linkOn } from "@/lib/own-site"
import { ownId } from "@/lib/own-id"
import { SettingsToaster } from "./toast"

// СТРАНИЦА «НАСТРОЙКИ САЙТА» ЭЛЕМЕНТА (шаги 324-8, 324-9). Копия редактора CONFIG (группы basics · seo · metaMedia и
// языки), адаптированная под один элемент: островки ходят в дверь элемента `/<lang>/admin/api/settings/app`, которая пишет его
// `APP-CONFIG` — только при выключенной связи с CONFIG. Подписи полей выбирает сервер и отдаёт островкам пропсами.
// Переключатели функций CONFIG сюда не перенесены (решение владельца 2026-09-28: «настройку переключателя я не хотел бы
// сейчас перекидывать»).

const GROUPS = ["basics", "seo", "metaMedia"] as const

function builtLanguages(): { langs: string[]; def: string } {
  const langs = (process.env.NEXT_PUBLIC_SUPPORTED_LANGUAGES ?? "en").split(",").map((s) => s.trim()).filter(Boolean)
  const def = process.env.NEXT_PUBLIC_DEFAULT_LOCALE?.trim() || langs[0] || "en"
  return { langs: langs.length ? langs : ["en"], def }
}

/** Языки, разблокированные для поисковиков в собранном сайте (340-3): сравнивается с сохранённым — «ждёт развёртывания». */
function builtUnlocked(): string[] {
  return (process.env.NEXT_PUBLIC_INDEXED_LANGUAGES ?? "").split(",").map((s) => s.trim()).filter(Boolean)
}

/**
 * Страница «Развёртывания» этого элемента в ядре (закон 337: человека ведут на страницу ЭЛЕМЕНТА, не на доску ядра).
 * Нет адреса ядра или имени — кнопки нет: ссылка в никуда хуже её отсутствия.
 */
function deploymentsHref(lang: string): string | undefined {
  const core = (process.env.ARCHITECT_URL ?? "").trim().replace(/\/+$/, "")
  const id = ownId()
  return core && id ? `${core}/${lang}/architect/${id}/build/deployments` : undefined
}

export function SiteSettings({ lang }: { lang: string }) {
  const w = siteSettingsWords(lang)
  const { langs, def } = builtLanguages()
  const catalogue = Object.values(ALL_LANGUAGE_METADATA)
    .map((m) => ({ code: m.code, flag: m.flag, nativeName: m.nativeName, englishName: m.englishName, tier: m.aiTier }))
    .sort((a, b) => a.englishName.localeCompare(b.englishName))
  const linked = linkOn("config")
  const deployHref = deploymentsHref(lang)
  const sw = searchLanguagesWords(lang)
  return (
    <div data-block="aeyz7" className="flex flex-col gap-8" data-site-settings={linked ? "linked" : "own"}>
      <p data-block="kf3nt" className={linked ? "rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-foreground" : "text-sm text-muted-foreground"}>
        {linked ? w.linked : w.own}
      </p>
      {GROUPS.map((group) => (
        <SettingsEditorIsland key={group} group={group} lang={lang} langs={langs} defaultLang={def} editLangLabel={w.editLang} ui={fieldsUi(lang)} words={w.access} />
      ))}
      <section data-block="a1did" className="flex flex-col gap-3" aria-label={w.languagesTitle}>
        <p data-block="dqvkk" className="text-sm text-muted-foreground">{w.languagesNote}</p>
        <LanguagesIsland catalogue={catalogue} built={langs} builtDefault={def} builtUnlocked={builtUnlocked()} ui={groupsUi(lang)} search={sw} deployHref={deployHref} words={w.access} />
      </section>
      {/* 340-4: тостер «Настроек сайта» не был поставлен вовсе — сообщения «Сохранено» уходили в пустоту. */}
      <SettingsToaster deployHref={deployHref} deployLabel={sw.toDeployments} closeLabel={sw.closeToast} />
    </div>
  )
}
