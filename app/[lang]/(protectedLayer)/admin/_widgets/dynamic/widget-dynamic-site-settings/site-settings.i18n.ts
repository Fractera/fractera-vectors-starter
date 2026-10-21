import type { AccessWords } from "./settings-access"

// Слова страницы «Настройки сайта» элемента (324-8, 324-9). Основа — en, перевод — ru; прочие языки берут en.
export type SiteSettingsWords = {
  linked: string
  own: string
  editLang: string
  languagesTitle: string
  languagesNote: string
  access: AccessWords
}

const EN: SiteSettingsWords = {
  linked: "This element takes its settings from the CONFIG element. To keep its own settings, turn «Sync with CONFIG» off in the element's Settings in the core — the last settings it got stay as its own, and this page starts saving.",
  own: "This element lives by its own settings: what you save here changes only this site.",
  editLang: "Language of the texts:",
  languagesTitle: "Languages of the site",
  languagesNote: "The language set is built into the site. After saving, rebuild the element: in the core — the element → Deployments → deploy it. Until then the site keeps its current languages.",
  access: {
    loading: "Loading the settings…",
    signin: "Sign in as the architect to change the settings.",
    signinLink: "Sign in",
    forbidden: "Only the architect can change these settings.",
    unavailable: "The settings are unavailable right now.",
    error: "The settings did not load.",
  },
}

const RU: SiteSettingsWords = {
  linked: "Этот элемент берёт настройки у элемента CONFIG. Чтобы у него были свои, выключите «Синхронизацию с CONFIG» в «Настройках» элемента в ядре — последние полученные настройки останутся его собственными, и эта страница начнёт сохранять.",
  own: "Элемент живёт своими настройками: всё, что вы сохраните здесь, меняет только этот сайт.",
  editLang: "Язык текстов:",
  languagesTitle: "Языки сайта",
  languagesNote: "Набор языков вшивается в сайт при сборке. После сохранения пересоберите элемент: в ядре — элемент → «Развёртывания» → развернуть. До этого сайт работает с прежними языками.",
  access: {
    loading: "Загружаю настройки…",
    signin: "Войдите как архитектор, чтобы менять настройки.",
    signinLink: "Войти",
    forbidden: "Менять эти настройки может только архитектор.",
    unavailable: "Настройки сейчас недоступны.",
    error: "Настройки не загрузились.",
  },
}

export function siteSettingsWords(lang: string): SiteSettingsWords {
  return lang === "ru" ? RU : EN
}
