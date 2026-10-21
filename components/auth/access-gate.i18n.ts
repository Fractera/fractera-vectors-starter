// Слова диалога отказа в доступе — 82 языка (`/code/CLAUDE.md` §4д).
//
// Это единственный экран, на котором человек встретит продукт в самом
// раздражённом состоянии: его не пустили. Объяснение на чужом языке в такую
// минуту читается как безразличие, поэтому здесь полный набор языков, а не
// десять.
//
// 🔒 СЕРВЕРНЫЙ РЕЗОЛВ — как и у остальных словарей: клиентский компонент
// получает строки пропсами, а не импортом.
//
// Языки, кроме английского, переведены моделью 2026-08-11. Подстановка
// `{roles}` сохранена во всех языках — её заменяет перечень требуемых ролей.

export type AccessGateUi = {
  /** Заголовок диалога. */
  title: string
  /** Строка с перечислением ролей; `{roles}` подставляется. */
  needRoles: string
  /** Что делать, если доступ должен быть. */
  haveAccess: string
  /** Что делать, если человек попал сюда случайно. */
  wrongPlace: string
  /** Кнопка «у меня есть доступ» → авторизация. */
  signIn: string
  /** Кнопка «вернуться на главную». */
  goHome: string
  /** Кнопка «отмена» → предыдущая страница. */
  cancel: string
  /** Пока идёт проверка. */
  checking: string
}

const UI: Record<string, AccessGateUi> = {
  en: { title: 'This page is not open to you', needRoles: 'It requires one of these roles: {roles}.', haveAccess: 'If you should have access, sign in — you will come straight back here.', wrongPlace: 'If you landed here by accident, go back or return to the home page.', signIn: 'I have access — sign in', goHome: 'Go to the home page', cancel: 'Cancel', checking: 'Checking access…' },
  ru: { title: 'Эта страница вам недоступна', needRoles: 'Требуется одна из этих ролей: {roles}.', haveAccess: 'Если считаете, что у вас есть доступ, войдите — вы сразу вернётесь сюда.', wrongPlace: 'Если вы попали сюда случайно, вернитесь назад или перейдите на главную страницу.', signIn: 'У меня есть доступ — войти', goHome: 'На главную', cancel: 'Отмена', checking: 'Проверяем доступ…' },
}

export function accessGateUi(lang: string): AccessGateUi {
  return UI[lang] ?? UI[lang.slice(0, 2)] ?? UI.en
}
