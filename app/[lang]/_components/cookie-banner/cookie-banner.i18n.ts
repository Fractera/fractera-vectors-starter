// Слова cookie-баннера — 82 языка, рядом с самим баннером.
//
// 🔒 ПОЧЕМУ ОНИ ЗДЕСЬ, А НЕ В НАСТРОЙКАХ. Настройки панели ПЕРЕОПРЕДЕЛЯЮТ эти
// слова, но не заменяют их: пока владелец ничего не менял, баннер обязан
// заговорить сам. Прежний движок держал тексты вместе со снесёнными страницами
// legal, и после его удаления баннер получал `undefined` — а он делает
// `strings.message.split(…)`, то есть УРОНИЛ БЫ страницу каждому новому
// посетителю. Дефект внесён мною при сносе legal и здесь же закрыт.
//
// 🔒 82 ЯЗЫКА ОБЯЗАТЕЛЬНЫ (правило 4д). Баннер — переиспользуемая часть
// продукта: он есть в каждом проекте, где включён, и появится в любом языке,
// который владелец включит. Согласие на сбор данных, написанное не на языке
// посетителя, юридически бесполезно — это не «непереведённая строка», а
// несостоявшееся согласие.
//
// `{policy}` — место ссылки на страницу политики. Оно обязано быть в каждом
// сообщении: баннер делит текст по нему.

export type BannerStrings = {
  message: string
  policyLinkLabel: string
  accept: string
  reject: string
}

const P = 'Cookie Policy'

const UI: Record<string, BannerStrings> = {
  en: { message: 'We use cookies to run this site and, with your consent, to measure traffic. See our {policy}.', policyLinkLabel: P, accept: 'Accept', reject: 'Reject' },
  ru: { message: 'Мы используем файлы cookie для работы сайта и, с вашего согласия, для оценки трафика. См. нашу {policy}.', policyLinkLabel: 'Политику использования файлов cookie', accept: 'Принять', reject: 'Отклонить' },
}

export function bannerUi(lang: string): BannerStrings {
  return UI[lang] ?? UI[lang.slice(0, 2)] ?? UI.en
}
