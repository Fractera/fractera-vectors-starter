// Слова самого верхнего меню — не подписи кнопок владельца, а служебные:
// «Меню» у бургера и aria-подписи ящиков.
//
// 🔒 82 ЯЗЫКА, И ЭТО НЕ ИЗБЫТОЧНОСТЬ (правило 4д). Меню — ПЕРЕИСПОЛЬЗУЕМАЯ часть
// продукта: она есть в каждом проекте и появится в любом языке, который владелец
// включит, в ту же минуту и без строчки кода. Придёт она туда по-английски —
// значит сломана сразу во всех новых языках. До этого здесь жили шесть языков
// прямо в компоненте, то есть на семьдесят шестом рынке бургер молча звался
// "Menu", а незрячий посетитель слышал английское «Open left menu».
//
// Подписи КНОПОК владельца сюда не относятся: они контент его сайта и идут по
// включённому набору `NEXT_PUBLIC_SUPPORTED_LANGUAGES` (`lib/menu/nav-config.ts`).

export type TopMenuUi = {
  /** Бургер на узком экране. */
  menu: string
  openLeft: string
  closeLeft: string
  openRight: string
  closeRight: string
  /** Зарезервированные кнопки верхнего меню без перехода (261-6). */
  /** 277: Store после Core, A2A после WEB4 — тоже без перехода. */
  store: string
  blog: string
}

const UI: Record<string, TopMenuUi> = {
  en: { menu: 'Menu', store: 'Store', blog: 'Blog', openLeft: 'Open left menu', closeLeft: 'Close left menu', openRight: 'Open right menu', closeRight: 'Close right menu' },
  ru: { menu: 'Меню', store: 'Store', blog: 'Блог', openLeft: 'Открыть левое меню', closeLeft: 'Закрыть левое меню', openRight: 'Открыть правое меню', closeRight: 'Закрыть правое меню' },
}

export function topMenuUi(lang: string): TopMenuUi {
  return UI[lang] ?? UI[lang.slice(0, 2)] ?? UI.en
}
