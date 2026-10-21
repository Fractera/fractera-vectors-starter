// СООБЩЕНИЯ ОБ ОТКАЗАХ ПЛАТФОРМЫ — 82 языка, одно место на весь проект.
//
// 🔒 ПОЧЕМУ ОДИН ФАЙЛ, А НЕ КОПИЯ В КАЖДОЙ ВОЗМОЖНОСТИ. «Нет ключа OpenAI» —
// один и тот же отказ для голосового ввода, перевода полей и любой будущей
// думающей части. Копии расходятся, и расходятся именно в редких языках, где
// этого никто не заметит до жалобы пользователя.
//
// 🔒 ПОЧЕМУ 82, А НЕ ДЕСЯТЬ. Набор языков приложения выбирает владелец, и
// выбрать он может любой из 82. Строка на десяти языках для остальных молча
// становится английской — ровно в тот момент, когда у человека что-то сломалось
// и он читает объяснение. Правило `/code/CLAUDE.md` §4д.
//
// 🔒 ЭТОТ МОДУЛЬ НЕ ИМПОРТИРУЕТСЯ ИЗ КЛИЕНТА. 82 языка в браузер — это
// мегабайты на каждой странице. Серверный компонент зовёт `platformErrors(lang)`
// и передаёт результат островку пропсами; тот же закон, что у панели.
//
// ТЕКСТЫ КОРОТКИЕ НАМЕРЕННО: это тост, а не статья. Каждое сообщение говорит,
// ЧТО случилось и КУДА идти; сама ссылка — рядом, отдельным элементом.

export type PlatformErrors = {
  /** Ключа нет вовсе. */
  noKey: string
  /** Ключ есть, но OpenAI его не принял. */
  badKey: string
  /** Кончились средства на балансе. */
  noFunds: string
  /** Слишком часто — ограничение частоты. */
  rateLimit: string
  /** Ответа не было. */
  upstream: string
  /** Подпись ссылки на страницу ключа в панели. */
  keyLink: string
  /** Подпись ссылки на баланс OpenAI. */
  fundsLink: string
}

const E: Record<string, PlatformErrors> = {
  en: { noKey: "No OpenAI key — add it in the control panel.", badKey: "OpenAI rejected the key — check it in the control panel.", noFunds: "Not enough funds on the OpenAI balance — top it up.", rateLimit: "OpenAI is limiting requests — wait a few seconds.", upstream: "OpenAI did not answer — try again.", keyLink: "OpenAI settings", fundsLink: "OpenAI billing" },
  ru: { noKey: "Нет ключа OpenAI — добавьте его в панели управления.", badKey: "OpenAI отклонил ключ — проверьте его в панели управления.", noFunds: "Недостаточно средств на балансе OpenAI — пополните его.", rateLimit: "OpenAI ограничивает частоту запросов — подождите несколько секунд.", upstream: "OpenAI не ответил — повторите попытку.", keyLink: "Настройки OpenAI", fundsLink: "Баланс OpenAI" },
}

/** Прямая ссылка на баланс — одна на весь продукт. */
export const OPENAI_BILLING_URL = "https://platform.openai.com/settings/organization/billing/overview"

/** Сообщения на языке страницы; неизвестный язык честно падает на английский. */
export function platformErrors(lang: string): PlatformErrors {
  return E[lang] ?? E[lang.slice(0, 2)] ?? E.en
}
