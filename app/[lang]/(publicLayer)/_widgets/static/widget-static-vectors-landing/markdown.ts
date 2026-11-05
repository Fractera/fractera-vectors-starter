// Текст виджета для машин. Своих слов у виджета нет: всё, что он рисует, — блоки данных главной, а блоки уже идут в markdown-копию
// страницы и в `llms-full.txt` (`lib/aio/blocks-to-markdown.ts`). Вернуть их здесь второй раз значило бы задвоить копию.
export function markdown(_lang: string): string {
  return ""
}
