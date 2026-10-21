// СЛОВА ПОДСВЕТКИ БЛОКОВ (317-3). `en` основа, `ru` перевод; строки выбирает сервер и передаёт островку пропсом.
// 336-2: кнопка рамки — «Нажми для обновления» (слово владельца 2026-09-29): окно задачи открывает ядро.
export type BlockHighlightWords = { update: string; sent: string; page: string; file: string; block: string; link: string }

const DICT: Record<string, BlockHighlightWords> = {
  en: { update: "Click to update", sent: "Opened in the core", page: "Page", file: "File", block: "Block", link: "Link" },
  ru: { update: "Нажми для обновления", sent: "Открыто в ядре", page: "Страница", file: "Файл", block: "Блок", link: "Ссылка" },
}

export function blockHighlightWords(lang: string): BlockHighlightWords {
  return DICT[lang] ?? DICT.en
}
