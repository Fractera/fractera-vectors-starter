// Words of the Google Analytics section of the policy pages (node step 449-2). en is the base, ru the translation; any other
// language falls back to en. `{id}` is the measurement ID from the site settings.

export type PolicyAnalyticsWords = { title: string; head: string[]; paragraphs: string[]; cookies: { name: string; purpose: string; life: string }[]; withdraw: string }

const WORDS: Record<string, PolicyAnalyticsWords> = {
  en: {
    title: "Google Analytics",
    head: ["Cookie", "Purpose", "Lifetime"],
    paragraphs: [
      "This site measures visits with Google Analytics (measurement ID {id}), a service of Google. It shows us which pages are read, how visitors arrive and on which devices, so we can improve the site. We do not use it for advertising.",
      "Until you press «Accept» in the cookie banner, Google Analytics runs in consent mode «denied»: it stores no cookies and sends Google only anonymous signals without an identifier. After «Accept» it stores the two cookies below.",
    ],
    cookies: [
      { name: "_ga", purpose: "tells one visitor from another", life: "2 years" },
      { name: "_ga_<container-id>", purpose: "keeps the state of the current visit", life: "2 years" },
    ],
    withdraw: "You can change your choice at any time with «Cookie settings» at the bottom of every page, or delete the cookies in your browser. How Google processes this data: https://policies.google.com/privacy",
  },
  ru: {
    title: "Google Analytics",
    head: ["Cookie", "Зачем", "Срок"],
    paragraphs: [
      "Сайт измеряет посещения с помощью Google Analytics (идентификатор счётчика {id}) — сервиса компании Google. Он показывает нам, какие страницы читают, откуда и с каких устройств приходят посетители, — чтобы мы улучшали сайт. Для рекламы мы его не используем.",
      "Пока вы не нажали «Принять» в баннере cookie, Google Analytics работает в режиме согласия «отказано»: cookie не сохраняет и отправляет Google только обезличенные сигналы без идентификатора. После «Принять» он сохраняет два cookie ниже.",
    ],
    cookies: [
      { name: "_ga", purpose: "отличает одного посетителя от другого", life: "2 года" },
      { name: "_ga_<container-id>", purpose: "хранит состояние текущего посещения", life: "2 года" },
    ],
    withdraw: "Изменить выбор можно в любой момент кнопкой «Настройки cookie» внизу каждой страницы или удалив cookie в браузере. Как Google обрабатывает эти данные: https://policies.google.com/privacy",
  },
}

export function policyAnalyticsWords(lang: string, id: string): PolicyAnalyticsWords {
  const w = WORDS[lang] ?? WORDS.en
  return { ...w, paragraphs: w.paragraphs.map((p) => p.replace("{id}", id)) }
}
