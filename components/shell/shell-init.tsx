import Script from "next/script";
import { READ_PREF_JS } from "./shared-prefs";

// СКРИПТЫ ДО ОТРИСОВКИ — тема и ширина из выбора посетителя (cookie проекта, 285-2) ставятся раньше первого
// кадра, иначе страница мигает темой по умолчанию. Часть оболочки (285-3): едут в каждую службу вместе с видом.
// Ставятся в <head> корневого макета.

// Inline theme bootstrap (runs before paint to avoid a light/dark flash). Shared by
// every root-owning zone ([lang] + (service)) after the static-rendering refactor
// (step 131), so the script lives in one place instead of being duplicated per layout.
const defaultTheme = process.env.NEXT_PUBLIC_DEFAULT_THEME ?? "light";

const themeScript = `
(function() {
  // 🛑 Запрещённое хранилище БРОСАЕТ на обращении к свойству, а не возвращает
  // null: без try/catch этот скрипт валится до отрисовки, в самом head.
  var saved = null;
  saved = (${READ_PREF_JS})('fractera-theme'); // 285-2: cookie проекта, иначе память адреса
  var theme = saved || '${defaultTheme}';
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }
})();
`;

export function ThemeInit() {
  return (
    <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
  );
}


// Поднимает сохранённый выбор ширины в `html[data-app-width]` ДО первой
// отрисовки — тем же приёмом, что и тема. Без этого лента успевала показаться
// широкой и прыгала на своё место после гидратации.
//
// 🔒 ЗАМЕР ПОЛОСЫ ПРОКРУТКИ УДАЛЁН 2026-08-15. Здесь считалась переменная
// `--app-sbw`: ширина полосы прокрутки, нужная единственно для вычисления
// `calc(100vw - …)` в прежнем «во всю ширину экрана» — `100vw` включает полосу и
// без поправки давал горизонтальную прокрутку. Растяжения на весь экран в
// механизме больше нет (оба состояния — предел: 80rem и 64rem), значит и
// поправка не нужна. Оставлять её значило бы держать обработчик `resize`,
// который на каждом изменении окна считает число, которое никто не читает.
const appWidthScript = `
(function() {
  try {
    if ((${READ_PREF_JS})('fractera-app-width') === 'narrow') { // 285-2: cookie проекта
      document.documentElement.setAttribute('data-app-width', 'narrow');
    }
  } catch (e) {}
})();
`;

export function AppWidthInit() {
  return (
    <Script id="app-width-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: appWidthScript }} />
  );
}
