// ОБЩИЙ СЛОВАРЬ УЗЛА И УСТАНОВЩИКА О СМЕННЫХ БЛОКАХ (257-3).
//
// Две сущности, и они разной природы — это не одно знание в двух файлах:
//
//   RegistryEntry — «ЗНАЕТ ВСЁ ОБО ВСЕХ». Лежит в WEB4-ITEMS-REGISTRY/web4-items.json,
//                   в git, виден в git diff. Его пишем мы.
//   ServiceProps  — «ЗНАЕТ ТОЛЬКО СЕБЯ». Лежит в репозитории службы
//                   (паспорт OWN-SERVICE-PROPS/ и NODE-CONTRACT.json, шаг 417). Его пишет автор службы, а установщик
//                   ТОЛЬКО ЧИТАЕТ: правка чужого паспорта затрётся при обновлении
//                   службы, и мы будем думать, что настройка на месте.
//
// 🔒 ПОЧЕМУ ТИПЫ ЛЕЖАТ ОТДЕЛЬНО ОТ ЧТЕНИЯ. Установщик — скрипт на .mjs, узел —
// TypeScript. Типы здесь нужны узлу; установщик исполняет ту же форму и сверяется
// с ней сторожем. Два описания одной формы разошлись бы молча, поэтому форма
// названа здесь, а сторож проверяет, что файл ей соответствует.

/** Род входа службы. Закрытый список — открытый превратился бы в свободный текст. */
export type EntryKind =
  /** вход раздаёт она, и такая на узле ровно одна */
  | "global"
  /** свой ключ в заголовке, как у слоя данных */
  | "own"
  /** вход даёт кто-то третий */
  | "provider"

/** Строка реестра: какой блок входит в узел и КАКОЙ ИМЕННО версии. */
export type RegistryEntry = {
  /** вечное имя элемента: по нему зовут, по нему лежит папка WEB4-ITEMS/<kind>/<id>/ */
  id: string
  /**
   * Род элемента (272): `core` ставит узел сам, `user` подключает человек. РЕШАЕТ ПУТЬ на диске —
   * `WEB4-ITEMS/<kind>/<id>`; отсутствует — читается как `core`.
   */
  kind?: "core" | "user"
  /** откуда клонировать */
  repo: string
  /** закреплённый ТЕГ, а не ветка */
  version: string
  /**
   * ФАКТИЧЕСКИЙ порт, на котором служба встала. `null` — ещё не установлена.
   * Желаемый номер стоит в паспорте; назначает узел и вписывает сюда.
   */
  port: number | null
  /** что этот блок даёт — словами, для человека и для будущей витрины */
  provides: string[]
  /** без него узел неполон; false — блок можно не ставить */
  required?: boolean
  note?: string
}

export type Registry = {
  services: RegistryEntry[]
}

/** Переменная из `.env.example` службы: имя плюс РОД, по которому ясно, кто отвечает. */
export type EnvVarKind =
  /** установщик знает сам: порт, адрес узла, языки */
  | "derived"
  /** установщик генерирует случайное и кладёт в ОБА конца */
  | "secret"
  /** чужой ключ: спросить человека и сказать, что без него не заработает */
  | "foreign"

/** Паспорт службы. Пишет автор службы; мы читаем и никогда не правим. */
export type ServiceProps = {
  id: string
  name: string
  summary?: string
  entry: EntryKind
  port: { desired: number; note?: string }
  /**
   * 🔒 ИМЯ ФАЙЛА ОКРУЖЕНИЯ НАЗЫВАЕТ САМА СЛУЖБА, И ЭТО ОПЛАЧЕНО ИЗМЕРЕНИЕМ (257-2).
   * Служба данных читает плоский `.env` (dotenv на resolve(__dirname, '.env')),
   * служба авторизации — `.env.local` по соглашению Next. Установщик, писавший бы
   * одно имя всем, оставил бы одну из двух БЕЗ КЛЮЧА — и она выглядела бы рабочей.
   */
  env: { file: string; example: string; note?: string }
  runtime: {
    stack: "next" | "node"
    node?: string
    build: string | null
    start: string
    nativeModules?: string[]
    note?: string
  }
  storage?: Record<string, unknown>
  provides?: string[]
  doors?: { path: string; method: string; gives: string }[]
  languages?: { count: number; source?: string; note?: string }
  pages?: { root: string; items: string[]; note?: string }
  license?: string
  origin?: Record<string, unknown>
}
