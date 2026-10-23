// Слова виджета «блоки этого элемента» (577-11) — свои, не общие с таблицей учётных записей: другие колонки и другое действие.
// Два языка — включённый набор элемента (`NEXT_PUBLIC_SUPPORTED_LANGUAGES=en,ru`).

export type ElementBlocksUi = {
  cols: { name: string; preview: string; section: string; description: string; origin: string; pages: string }
  open: string
  noPreview: string
  /** Блок поставлен после сборки: в таблице он уже есть, нарисовать его может только сборка. */
  waitsBuild: string
  fromCatalogue: string
  fromTemplate: string
  nowhere: string
  empty: string
  count: string
  perPage: string
  pageOf: string
  first: string
  prev: string
  next: string
  last: string
  /** Страница Preview: что сказать, когда показать нечего. */
  previewEmpty: string
  /** Страница раздела: в нём ещё нет ни одного блока этого элемента. */
  sectionEmpty: string
}

const UI: Record<string, ElementBlocksUi> = {
  en: {
    cols: { name: 'Block', preview: 'Preview', section: 'Section', description: 'Description', origin: 'Origin', pages: 'Where it stands' },
    open: 'Open', noPreview: 'no data', waitsBuild: 'waits for a build', fromCatalogue: 'catalogue, v{version}', fromTemplate: 'template',
    nowhere: 'on no page yet', empty: 'This element has no blocks yet.', count: '{count} blocks', perPage: 'per page',
    pageOf: 'page {page} of {pages}', first: 'First page', prev: 'Previous page', next: 'Next page', last: 'Last page',
    previewEmpty: 'No page of this element uses this block yet, and it has no card with a sample — there is nothing to draw.',
    sectionEmpty: 'No block of this element belongs to this section yet.',
  },
  ru: {
    cols: { name: 'Блок', preview: 'Preview', section: 'Раздел', description: 'Описание', origin: 'Откуда', pages: 'Где стоит' },
    open: 'Открыть', noPreview: 'нет данных', waitsBuild: 'ждёт сборки', fromCatalogue: 'каталог, v{version}', fromTemplate: 'шаблон',
    nowhere: 'пока ни на одной странице', empty: 'У этого элемента пока нет блоков.', count: '{count} блоков', perPage: 'на странице',
    pageOf: 'страница {page} из {pages}', first: 'Первая страница', prev: 'Предыдущая страница', next: 'Следующая страница', last: 'Последняя страница',
    previewEmpty: 'Этот блок ещё не стоит ни на одной странице элемента, и у него нет карточки с образцом — рисовать нечего.',
    sectionEmpty: 'В этом разделе пока нет ни одного блока этого элемента.',
  },
}

export function elementBlocksUi(lang: string): ElementBlocksUi {
  return UI[lang] ?? UI.en
}
