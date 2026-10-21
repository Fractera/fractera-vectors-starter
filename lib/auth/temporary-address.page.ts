// СТРАНИЦА ПРЕДУПРЕЖДЕНИЯ, КОТОРУЮ ОТДАЁТ ПРОКСИ.
//
// 🔒 ПОЧЕМУ ОНА СОБИРАЕТСЯ ЗДЕСЬ, А НЕ МАРШРУТОМ NEXT. Прокси обязан ответить
// ДО маршрутизации: адреса `/login`, `/register`, `/logout` принадлежат службе
// входа, и страницы под ними в узле не существует. Завести ради этого маршрут
// значило бы создать страницу, которая на постоянном адресе не нужна вовсе.
//
// 🔒 НИ ОДНОГО ВНЕШНЕГО ФАЙЛА. Ответ приходит с адреса, где может не быть ни
// стилей, ни шрифтов проекта, — страница обязана выглядеть целой сама по себе.
// Тёмная тема берётся системной настройкой посетителя.

import { temporaryAddressStrings } from "./temporary-address.i18n"

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// 🔒 АДРЕС ВКЛАДКИ СОБИРАЕТСЯ ЗДЕСЬ ОДИН РАЗ. Отказ без адреса есть тупик: мы
// говорим «нужен постоянный домен» — значит обязаны сказать, где написано, как
// его подключить. Вкладка живёт в слое архитектора и на временном адресе открыта
// (решение 241/242 о снятом замке), то есть ссылка ведёт в работающее место.
const HOW_TO_PATH = "/architect/hosting/domain"

export function temporaryAddressPage(lang: string, backHref: string): string {
  const s = temporaryAddressStrings(lang)
  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(s.title)}</title>
<style>
  :root { color-scheme: light dark;
    --bg:#f6f6f7; --card:#fff; --ink:#18181b; --dim:#52525b; --line:#e4e4e7; --accent:#2563eb; }
  @media (prefers-color-scheme: dark) { :root {
    --bg:#0b0b0c; --card:#141416; --ink:#f4f4f5; --dim:#a1a1aa; --line:#27272a; --accent:#60a5fa; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; padding:24px;
    background:var(--bg); color:var(--ink);
    font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  .card { width:100%; max-width:34rem; background:var(--card); border:1px solid var(--line);
    border-radius:16px; padding:28px; }
  .badge { display:inline-block; font-size:12px; letter-spacing:.04em; text-transform:uppercase;
    color:var(--dim); border:1px solid var(--line); border-radius:999px; padding:4px 10px; margin-bottom:14px; }
  h1 { font-size:1.35rem; line-height:1.3; margin:0 0 12px; }
  p { margin:0 0 12px; color:var(--dim); }
  p.lead { color:var(--ink); }
  a.back { display:inline-block; margin-top:8px; padding:10px 16px; border-radius:10px;
    background:var(--accent); color:#fff; text-decoration:none; font-weight:600; }
  a.how { display:inline-block; margin:8px 0 0 12px; padding:10px 16px; border-radius:10px;
    border:1px solid var(--line); color:var(--ink); text-decoration:none; font-weight:600; }
  @media (max-width:420px) { a.back, a.how { display:block; margin-left:0; text-align:center; } }
</style>
</head>
<body>
  <main class="card">
    <span class="badge">${esc(lang)}</span>
    <h1>${esc(s.title)}</h1>
    <p class="lead">${esc(s.body)}</p>
    <p>${esc(s.why)}</p>
    <p>${esc(s.what)}</p>
    <a class="back" href="${esc(backHref)}">${esc(s.back)}</a>
    <a class="how" href="${esc(`/${lang}${HOW_TO_PATH}`)}">${esc(s.howTo)} →</a>
  </main>
</body>
</html>`
}
