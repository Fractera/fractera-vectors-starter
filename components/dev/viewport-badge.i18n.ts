// СЛОВА ИНДИКАТОРА ШИРИНЫ (333-4). `en` основа, `ru` перевод; строки выбирает сервер и передаёт островку пропсом.
const DICT: Record<string, { close: string }> = {
  en: { close: "Hide the screen-width badge (turn it back on in PLATFORM-CONFIG)" },
  ru: { close: "Скрыть индикатор ширины (включается снова в PLATFORM-CONFIG)" },
}

export function viewportBadgeWords(lang: string): { close: string } {
  return DICT[lang] ?? DICT.en
}
