// Слова окна отчёта о задаче (узел, шаг 356-2). `en` основа, `ru` перевод; выбирает сервер, островку — пропсом.
export type TaskReportWords = { title: string; task: string; done: string; check: string; close: string; missing: string }

const WORDS: Record<"en" | "ru", TaskReportWords> = {
  en: { title: "What was done", task: "Task", done: "Done", check: "How to check", close: "Close", missing: "This build carries no task report." },
  ru: { title: "Что сделано", task: "Задача", done: "Сделано", check: "Как проверить", close: "Закрыть", missing: "К этой сборке отчёт о задаче не приложен." },
}

export function taskReportWords(lang: string): TaskReportWords {
  return lang === "ru" ? WORDS.ru : WORDS.en
}
