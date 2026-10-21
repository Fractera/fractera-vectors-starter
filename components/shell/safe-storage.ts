// ЛОКАЛЬНОЕ ХРАНИЛИЩЕ, КОТОРОЕ НЕ РОНЯЕТ СТРАНИЦУ.
//
// ✗ Оплачено 2026-09-18, экраном владельца: `Failed to read the 'localStorage'
// property from 'Window': Access is denied for this document` — и вместо сайта
// «Something went wrong. This page could not be displayed».
//
// 🛑 ГЛАВНОЕ, ЧТО НАДО ЗНАТЬ ОБ ЭТОМ API: В ЗАПРЕЩЁННОМ БРАУЗЕРЕ ОНО НЕ
// ВОЗВРАЩАЕТ `null` — ОНО БРОСАЕТ. Причём бросает не метод `getItem`, а **само
// обращение к свойству** `window.localStorage`. Поэтому не спасает ни
// `typeof window !== 'undefined'`, ни проверка `if (localStorage)`: до неё уже
// доходит исключение. Запрет включается будничными вещами — настройкой
// приватности, блокировкой данных сайта, приватным окном, политикой
// организации; в каждом из этих случаев страница обязана открыться и работать.
//
// 🔒 ПОЧЕМУ ЭТО ЛОМАЕТ ВСЁ, А НЕ ОДНУ КНОПКУ. Первым к хранилищу обращается
// провайдер темы из корневого layout — значит падает корень, а с ним каждая
// страница сайта. Цена незащищённого чтения тут максимальная из возможных.
//
// 🛑 Чего этот модуль НЕ делает и не должен: он не подменяет хранилище памятью
// процесса. Сохранить «на этот сеанс» значит наврать человеку — он вернётся
// завтра и не найдёт своей настройки, хотя интерфейс обещал её запомнить.
// Честное поведение — умолчание и работающая страница.

function storage(): Storage | null {
  try {
    // Обращение к свойству — то самое место, где прилетает SecurityError.
    const store = window.localStorage;
    // В некоторых сборках браузеров свойство есть, но выключено; пробное
    // обращение стоит дёшево и отвечает окончательно.
    const probe = "__fractera_probe__";
    store.setItem(probe, "1");
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

/** Прочитать значение. Хранилище недоступно или ключа нет — `null`. */
export function readStored(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Записать значение. Возвращает `false`, если записать не удалось. */
export function writeStored(key: string, value: string): boolean {
  try {
    const store = storage();
    if (!store) return false;
    store.setItem(key, value);
    return true;
  } catch {
    // Сюда приходит и переполненная квота — у неё та же судьба: настройка не
    // сохранится, но страница продолжит работать.
    return false;
  }
}

/** Удалить значение. Возвращает `false`, если удалить не удалось. */
export function removeStored(key: string): boolean {
  try {
    const store = storage();
    if (!store) return false;
    store.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Доступно ли хранилище вообще — для интерфейса, который хочет это показать. */
export function storageAvailable(): boolean {
  return storage() !== null;
}
