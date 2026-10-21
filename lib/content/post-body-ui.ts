// СЛОВА МЕХАНИЗМА СТРАНИЦЫ (314-2): то, что печатает фабрика, а не автор страницы. Слова старого каталога (кнопки
// документации, меню рабочего экрана, заглушка карусели) ушли вместе с `sections/`.
export type PostBodyUi = {
  /** Заголовок раздела вопросов — блок `faq` из «Блоков». */
  faqTitle: string
}

const UI: Record<string, PostBodyUi> = {
  en: { faqTitle: 'Frequently asked questions' },
  ru: { faqTitle: 'Частые вопросы' },
}

export function getPostBodyUi(lang: string): PostBodyUi {
  return UI[lang] ?? UI.en
}
