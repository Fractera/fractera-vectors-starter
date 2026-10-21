// СЛОВА ПРЕДУПРЕЖДЕНИЯ О ВРЕМЕННОМ АДРЕСЕ — рядом с самим признаком.
//
// 🔒 ПОЧЕМУ ЗДЕСЬ, А НЕ В ОБЩЕМ СЛОВАРЕ ОТКАЗОВ. `lib/i18n/platform-errors.ts`
// держит отказы ЧУЖОЙ службы (ключ OpenAI, баланс, частота). Здесь отказ нашего
// собственного устройства, и он живёт рядом с функцией, которая его порождает, —
// тот же приём, что у слов cookie-баннера рядом с баннером.
//
// 🔒 ЭТОТ МОДУЛЬ СЕРВЕРНЫЙ: его зовёт прокси. Из клиента не импортировать —
// словарь уедет в браузер целиком (сторож `check-lang-delivery` это поймает).
//
// 🛑 ПОЧЕМУ ЭТО ВООБЩЕ ТЕКСТ, А НЕ ПУСТОЙ 404. Голый 404 читается как «сайт
// сломан»: человек нажал кнопку и получил страницу ошибки без объяснения. Слово
// владельца 2026-09-21: «need warning notification for .trycloudflare.com for
// all actions». Отказ обязан называть причину и следующий шаг — отказ без
// адреса есть тупик.

export type TemporaryAddressStrings = {
  title: string
  body: string
  why: string
  what: string
  back: string
  /** Кнопка на вкладку архитектора, где объяснено подключение своего домена. */
  howTo: string
}

const T: Record<string, TemporaryAddressStrings> = {
  en: {
    title: "This action needs a permanent address",
    body: "You are on a temporary public address. Signing in, registration and signing out are switched off here.",
    why: "A temporary address is issued for a few hours and changes on every restart. Sessions are bound to a name, so an account created here would stop being recognised the moment the address changes.",
    what: "Open the site on the computer where it runs, or connect your own domain — after that everything on this page works.",
    back: "Back to the site",
    howTo: "How to connect your own domain",
  },
  ru: {
    title: "Это действие требует постоянного адреса",
    body: "Вы на временном публичном адресе. Вход, регистрация и выход здесь выключены.",
    why: "Временный адрес выдаётся на несколько часов и меняется при каждом перезапуске. Сессия привязана к имени, поэтому учётная запись, созданная здесь, перестала бы узнаваться в тот момент, когда адрес сменится.",
    what: "Откройте сайт на том компьютере, где он работает, или подключите собственный домен — после этого всё описанное заработает.",
    back: "Вернуться на сайт",
    howTo: "Как подключить свой домен",
  },
}

export function temporaryAddressStrings(lang: string): TemporaryAddressStrings {
  return T[lang] ?? T[lang.slice(0, 2)] ?? T.en
}
