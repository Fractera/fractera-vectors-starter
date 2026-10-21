// СЛОВА БЛОКА «ЯЗЫКИ ДЛЯ ПОИСКОВЫХ СИСТЕМ» (шаг 340-3). Серверный словарь: страница берёт его по языку и передаёт островку.
//
// Совет — слова владельца 2026-09-30, отредактированные: «запускать проект продакшн рекомендуется только на одном или двух
// языках… английский язык плюс язык по дефолту… На запуске проекта вы получите именно такие настройки поисковой
// оптимизации… каждые полгода добавлять ещё один регион… под вашу собственную ответственность».
// 🔒 «Раз в полгода» подано как рекомендация, а не как правило Google: в документации Google такого правила нет (проверено
// 2026-09-30). Довод Google — правило о массово созданных страницах, оно названо в `why`.

export type SearchLanguagesWords = {
  title: string
  adviceTitle: string
  advice: string
  why: string
  openTitle: string
  alwaysOpen: string
  unlockedByYou: string
  close: string
  closedTitle: string
  pick: string
  unlock: string
  confirmTitle: string
  confirmText: string
  confirmYes: string
  cancel: string
  allOpen: string
  saved: string
  failed: string
  pendingTitle: string
  pending: string
  clean: string
  deploy: string
  deployNote: string
  toDeployments: string
  closeToast: string
}

const en: SearchLanguagesWords = {
  title: "Languages for search engines",
  adviceTitle: "Launch on one or two languages",
  advice:
    "The recommended launch strategy is English plus your site's default language, if it is not English — a new project starts with exactly these search settings. Once the project gets traffic, open one more region about every six months: the one most of your visitors come from right now. People see the site in every language you chose above; this list only decides what search engines are shown.",
  why:
    "Why: Google's spam policies treat many pages produced by automated translation with little value for readers as scaled content abuse, and advise keeping such pages out of Search.",
  openTitle: "Open to search engines",
  alwaysOpen: "always open",
  unlockedByYou: "unlocked by you",
  close: "Close again",
  closedTitle: "Open one more language",
  pick: "Choose a language",
  unlock: "Unlock at my own risk",
  confirmTitle: "Open this language to search engines?",
  confirmText:
    "Its pages will be offered to search engines after the next deployment. If the translation is automatic and thin, Google may treat it as low-value content. You take this decision at your own risk and can close the language again at any time.",
  confirmYes: "Yes, unlock",
  cancel: "Cancel",
  allOpen: "Every language of the site is already open to search engines.",
  saved: "Saved. Search engines will see the change after the next deployment.",
  failed: "Could not save. Try again.",
  pendingTitle: "Waiting for deployment",
  pending: "The saved set differs from the one the site is built with. The change reaches every published page after a new deployment.",
  clean: "The site is built with this set.",
  deploy: "Start a new deployment",
  deployNote:
    "The deployment changes the settings of every published page: robots tags, the sitemap and the map of alternate languages. It takes about as long as a regular build of this element — usually a few minutes. The site keeps working meanwhile.",
  toDeployments: "Open Deployments",
  closeToast: "Close",
}

const ru: SearchLanguagesWords = {
  title: "Языки для поисковых систем",
  adviceTitle: "Запускайтесь на одном-двух языках",
  advice:
    "Рекомендуемая стратегия запуска — английский плюс язык сайта по умолчанию, если он не английский: именно с такими настройками поисковой оптимизации запускается новый проект. Когда у проекта появится трафик, открывайте поисковикам ещё один регион примерно раз в полгода — тот, откуда сейчас приходит больше всего посетителей. Люди видят сайт на всех языках, выбранных выше; этот список решает только то, что показывается поисковым системам.",
  why:
    "Почему: правила Google считают нарушением массово созданные страницы, в том числе автоматические переводы, мало полезные читателю, и советуют не показывать такие страницы в поиске.",
  openTitle: "Открыты поисковикам",
  alwaysOpen: "открыт всегда",
  unlockedByYou: "открыт вами",
  close: "Закрыть снова",
  closedTitle: "Открыть ещё один язык",
  pick: "Выберите язык",
  unlock: "Разблокировать под мою ответственность",
  confirmTitle: "Открыть этот язык поисковым системам?",
  confirmText:
    "Его страницы будут предложены поисковикам после следующего развёртывания. Если перевод автоматический и бедный, Google может счесть его малоценным. Вы принимаете это решение под свою ответственность и в любой момент можете закрыть язык снова.",
  confirmYes: "Да, разблокировать",
  cancel: "Отмена",
  allOpen: "Все языки сайта уже открыты поисковым системам.",
  saved: "Сохранено. Поисковики увидят изменение после следующего развёртывания.",
  failed: "Не удалось сохранить. Попробуйте ещё раз.",
  pendingTitle: "Ждёт развёртывания",
  pending: "Сохранённый набор отличается от того, с которым собран сайт. Изменение дойдёт до всех опубликованных страниц после нового развёртывания.",
  clean: "Сайт собран с этим набором.",
  deploy: "Запустить новое развёртывание",
  deployNote:
    "Развёртывание меняет настройки всех опубликованных страниц: теги для роботов, карту сайта и карту альтернативных языков. Это займёт примерно столько же, сколько обычная сборка элемента, — обычно несколько минут. Сайт всё это время работает.",
  toDeployments: "К развёртываниям",
  closeToast: "Закрыть",
}

const DICT: Record<string, SearchLanguagesWords> = { en, ru }

export function searchLanguagesWords(lang: string): SearchLanguagesWords {
  return DICT[lang] ?? en
}
