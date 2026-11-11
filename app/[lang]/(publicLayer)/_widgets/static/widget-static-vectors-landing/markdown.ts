// Текст виджета для машин. Своих слов у виджета нет: всё, что он рисует, — части данных главной, а они уже идут в markdown-копию
// страницы и в `llms-full.txt` (`lib/aio/page-to-markdown.ts`). Вернуть их здесь второй раз значило бы задвоить копию.
export function markdown(_lang: string): string {
  return ""
}
