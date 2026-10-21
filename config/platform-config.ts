import "server-only";
import { readFileSync } from "fs";
import { join } from "path";
import { cache } from "react";

// ЧИТАТЕЛЬ ВЫКЛЮЧАТЕЛЕЙ ВОЗМОЖНОСТЕЙ — недостающая половина механизма.
//
// 🔒 ЧТО ЭТО ЛЕЧИТ. Панель управления давно писала эти девять флагов в
// `PLATFORM-CONFIG/platform-config.json`, но в приложении не было ни файла,
// который бы их читал, ни самой папки. То есть владелец переключал «Верхнее
// меню» и «Авторизация», видел изменение на экране панели — и оно не доходило
// до сайта никогда. Выключатель, который ничего не выключает, хуже
// отсутствующего: человек считает задачу решённой.
//
// Приёмы намеренно те же, что у `config/app-config.ts` (соседний файл): чтение с
// диска, слияние поверх кодовых значений, `cache()` на один проход рендера.
// Два читателя конфигов, ведущие себя по-разному, — источник вопросов «почему
// здесь применилось, а там нет».
//
// 🔒 ПРИМЕНЯЕТСЯ БЕЗ ПЕРЕСБОРКИ. Файл читается на рендере, а `[lang]`-макет
// живёт под ISR (`revalidate`), поэтому сохранение в панели видно на следующей
// перегенерации; панель дополнительно зовёт `/api/revalidate`, и тогда — сразу.
// Страницы при этом остаются статическими: динамическими их делает не чтение
// файла, а `force-dynamic`, которого здесь нет.
//
// 🔒 НИКОГДА НЕ ИМПОРТИРОВАТЬ ИЗ КЛИЕНТСКОГО КОМПОНЕНТА — здесь `fs`. Значения
// уезжают в островки пропсами из серверного компонента.

// 🔒 ФОРМА И УМОЛЧАНИЯ ПЕРЕЕХАЛИ в `config/platform-config.defaults.ts`
// (2026-08-18), чтобы четыре конфига слота были устроены одинаково: у каждого
// пара «данные + читатель». Здесь они ре-экспортируются, поэтому прежние импорты
// из `@/config/platform-config` продолжают работать без правок.
export {
  FEATURE_DEFAULTS,
  DEFAULT_PLATFORM_CONFIG_FILE,
} from "./platform-config.defaults";
export type {
  FeatureKey,
  PlatformConfig,
  PlatformConfigFile,
} from "./platform-config.defaults";

import {
  FEATURE_DEFAULTS as DEFAULTS,
  DEFAULT_PLATFORM_CONFIG_FILE,
  type FeatureKey,
  type PlatformConfig,
} from "./platform-config.defaults";
import { platformConfigSchema } from "./platform-config.schema";
import { validateConfig } from "./config-validate";
import { projectSettingsPatch } from "@/lib/project-settings";

const CONFIG_PATH =
  process.env.PLATFORM_CONFIG_PATH ??
  join(process.cwd(), "PLATFORM-CONFIG", "platform-config.json");

// 🔒 У ЭЛЕМЕНТА НАСТРОЕК ВЫКЛЮЧАТЕЛИ ЛЕЖАТ ПЛОСКО (`{"faq": false}`), У ФАЙЛА САЙТА — В ВЕТКЕ `features`.
// Форма переводится здесь, в одном месте: ключ-выключатель уходит в `features`, остальное (режим маршрутизации)
// остаётся наверху. Без перевода копия читалась бы как «владелец ничего не решал» — молча, без ошибки.
function asPlatformFile(patch: Record<string, unknown>): Record<string, unknown> {
  const features: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k in DEFAULTS) features[k] = v;
    else rest[k] = v;
  }
  return { ...rest, features };
}

/**
 * Живое состояние возможностей.
 *
 * Отсутствующий файл — НОРМА, а не сбой: он означает «владелец ещё ничего не
 * настраивал», и тогда действуют значения по умолчанию. Нечитаемый файл ведёт
 * себя так же: показать приложение со значениями по умолчанию честнее, чем
 * уронить страницу из-за одной сломанной скобки в настройках.
 */
export const getPlatformConfig = cache((): PlatformConfig => {
  let parsed: unknown = {};
  try {
    // 299-6: решения владельца — из последней копии элемента «Настройки проекта»; копии нет — свой файл (посев).
    const fromElement = projectSettingsPatch("platform");
    parsed = fromElement ? asPlatformFile(fromElement) : JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    parsed = {};
  }

  // Схема описывает ФАЙЛ, а не этот ответ: на диске лежат решения владельца, а
  // возвращается полная картина. Выключатель не того типа лечится тем же путём,
  // что и его отсутствие, — умолчанием, и владелец при этом остаётся «не
  // высказавшимся», что для `explicit` и есть правда.
  const raw = validateConfig(
    platformConfigSchema,
    parsed,
    DEFAULT_PLATFORM_CONFIG_FILE,
    "PLATFORM-CONFIG",
  ) as Record<string, unknown>;

  const saved = (raw.features ?? {}) as Record<string, unknown>;
  let fromOwnFile: boolean | null = null;
  try {
    const own = JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as { features?: { viewportBadge?: unknown } };
    if (typeof own.features?.viewportBadge === "boolean") fromOwnFile = own.features.viewportBadge;
  } catch { /* своего файла нет — решает копия или умолчание */ }
  const features = {} as Record<FeatureKey, boolean>;
  const explicit = {} as Record<FeatureKey, boolean>;
  for (const key of Object.keys(DEFAULTS) as FeatureKey[]) {
    const own = typeof saved[key] === "boolean";
    explicit[key] = own;
    features[key] = own ? (saved[key] as boolean) : DEFAULTS[key];
  }

  // 333-4: ИНДИКАТОР ШИРИНЫ — ИНСТРУМЕНТ РАЗРАБОТЧИКА ЭТОГО ЭЛЕМЕНТА, А НЕ РЕШЕНИЕ ПРОЕКТА. Его закрывает архитектор кнопкой
  // (`/api/settings/platform` пишет свой файл); своё значение сильнее копии CONFIG — иначе закрытие не действовало бы при связи.
  if (fromOwnFile !== null) {
    features.viewportBadge = fromOwnFile
    explicit.viewportBadge = true
  }

  return {
    features,
    explicit,
    parallel: raw.routingMode === "parallel" || raw.parallelRouting === true,
  };
});

/** Включена ли возможность. Единственная форма вопроса, которую стоит задавать. */
export function featureOn(key: FeatureKey): boolean {
  return getPlatformConfig().features[key];
}

/** Высказывался ли владелец об этой возможности — см. `explicit` выше. */
export function featureDecided(key: FeatureKey): boolean {
  return getPlatformConfig().explicit[key];
}
