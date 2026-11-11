// СЛОВА БРИФА ДИЗАЙНА (шаг 706-4).
export type BriefWords = {
  title: string; lead: string; inherited: string
  audience: string; audienceHint: string
  character: string; characterHint: string
  references: string; referencesHint: string; link: string; note: string; upload: string; uploading: string; addReference: string; remove: string
  avoid: string; avoidHint: string
  skill: string; skillHint: string; noSkill: string; pinnedFrom: string
  save: string; saving: string; saved: string; failed: string
}

const EN: BriefWords = {
  title: 'Brief',
  lead: 'Before fonts and colours: who the site is for and what it should feel like. The element\'s agent reads this first and designs the pages from it.',
  inherited: 'Taken from element',
  audience: 'Who it is for', audienceHint: 'The people who will open the site, and what they come for.',
  character: 'Character', characterHint: 'Up to five words, separated by commas: calm, strict, warm…',
  references: 'References', referencesHint: 'Sites or screenshots whose spirit you like, with a word on what exactly.', link: 'Link (https://…)', note: 'What you like in it', upload: 'Upload a screenshot', uploading: 'Uploading…', addReference: 'Add a reference', remove: 'Remove',
  avoid: 'What to avoid', avoidHint: 'What you do not want to see: a template look, gradients, too much text…',
  skill: 'Design skill', skillHint: 'Chosen and pinned in the core: the element\'s «Build → Design» tab finds design skills in your collection, the node\'s base and the checked catalog, builds test pages and pins the winner.', noSkill: 'Not chosen yet', pinnedFrom: 'pinned from the prototype',
  save: 'Save the brief', saving: 'Saving…', saved: 'Saved', failed: 'Not saved:',
}

const RU: BriefWords = {
  title: 'Бриф',
  lead: 'Прежде шрифтов и цветов: для кого сайт и каким он должен ощущаться. Агент элемента читает это первым и рисует страницы по брифу.',
  inherited: 'Взят у элемента',
  audience: 'Для кого', audienceHint: 'Люди, которые откроют сайт, и за чем они приходят.',
  character: 'Характер', characterHint: 'До пяти слов через запятую: спокойный, строгий, тёплый…',
  references: 'Референсы', referencesHint: 'Сайты или скриншоты, дух которых нравится, и слово о том, что именно.', link: 'Ссылка (https://…)', note: 'Что в нём нравится', upload: 'Загрузить скриншот', uploading: 'Загружаю…', addReference: 'Добавить референс', remove: 'Убрать',
  avoid: 'Чего избегать', avoidHint: 'Чего вы не хотите видеть: шаблонный вид, градиенты, много текста…',
  skill: 'Навык дизайна', skillHint: 'Выбирается и закрепляется в ядре: вкладка элемента «Строительство → Дизайн» находит навыки дизайна в вашей коллекции, базе узла и проверенном каталоге, строит тестовые страницы и закрепляет победителя.', noSkill: 'Пока не выбран', pinnedFrom: 'закреплён из прототипа',
  save: 'Сохранить бриф', saving: 'Сохраняю…', saved: 'Сохранено', failed: 'Не сохранено:',
}

export function briefWords(lang: string): BriefWords {
  return lang === 'ru' ? RU : EN
}
