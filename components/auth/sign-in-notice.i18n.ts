// Слова плашки, которая встречает человека на сайте после входа (260-3).
// Два языка — основа и перевод; остальные читают английский (закон линии WEB4, шаг 255).
// {who} — почта вошедшего, {role} — одна роль, выбранная правилом `pickRole` островка.

export type SignInNoticeStrings = {
  signedIn: string
  failed: string
}

const STRINGS: Record<string, SignInNoticeStrings> = {
  en: {
    signedIn: "You're signed in as {who}. Role: {role}.",
    failed: "Sign-in was not confirmed. Please try again.",
  },
  ru: {
    signedIn: "Вы вошли как {who}. Роль: {role}.",
    failed: "Вход не подтвердился. Попробуйте ещё раз.",
  },
}

export function signInNoticeStrings(lang: string): SignInNoticeStrings {
  return STRINGS[lang] ?? STRINGS.en
}
