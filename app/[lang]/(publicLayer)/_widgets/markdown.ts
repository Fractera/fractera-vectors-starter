import { markdown as policyAnalytics } from "./static/widget-static-policy-analytics/markdown"
import { markdown as referenceTitle } from "./static/widget-static-reference-title/markdown"

// ТЕКСТ ВИДЖЕТОВ ЭТОЙ ВЕТКИ ДЛЯ МАШИН (узел, шаг 428). Пара к `index.tsx`: там виджет рисуется для человека, здесь его текст
// уходит в markdown-копию страницы (`/<язык>/index.md`) и в `llms-full.txt`. Отдельный файл, а не поле в `index.tsx`: маршрут
// копии не должен тянуть компоненты и островки. Ключи обязаны совпадать с `WIDGETS` — `npm run check:aio` сверяет.
export const WIDGET_MARKDOWN: Record<string, (lang: string) => string> = {
  "widget-static-policy-analytics": policyAnalytics,
  "widget-static-reference-title": referenceTitle,
}
