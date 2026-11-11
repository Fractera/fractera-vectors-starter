// Схема `DESIGN-CONFIG/design-config.json` — форма ДАННЫХ.
//
// 🔒 ЦВЕТ НЕ ПРОВЕРЯЕТСЯ РАЗБОРОМ СТРОКИ. Значение подставляется в переменную CSS
// как есть, и допустимых форм много: `#0b0f19`, `oklch(0.2 0 0)`, `rgb(…)`,
// `color-mix(…)`. Проверка «похоже ли это на цвет» запретила бы половину из них,
// а выигрыш дала бы нулевой: неверный цвет виден на первой же странице, в отличие
// от неверного ТИПА, который роняет рендер.
//
// Все ветки необязательные: пустая настройка означает «владелец не высказался,
// берётся тема проекта» — умолчания оформления живут в CSS темы, а не здесь.

import { z } from "zod";
import type { DesignConfig } from "./design-config.defaults";

const colorRoles = z.looseObject({
  primary: z.string().optional(),
  secondary: z.string().optional(),
  accent: z.string().optional(),
  background: z.string().optional(),
  foreground: z.string().optional(),
  muted: z.string().optional(),
  border: z.string().optional(),
  destructive: z.string().optional(),
  // 711-7: surfaces and the focus ring
  card: z.string().optional(),
  popover: z.string().optional(),
  input: z.string().optional(),
  ring: z.string().optional(),
});

const fontRole = z.looseObject({
  family: z.string(),
  /** Адрес подключения хранится ОТДЕЛЬНО от имени — склеенная строка однажды уедет в `font-family` целиком. */
  import: z.string().optional(),
});

export const designConfigSchema = z.looseObject({
  colors: z.looseObject({ light: colorRoles, dark: colorRoles }),
  fonts: z.looseObject({
    heading: fontRole.optional(),
    body: fontRole.optional(),
    mono: fontRole.optional(),
  }),
  type: z.looseObject({
    scale: z.number().optional(),
    leading: z.number().optional(),
    headingWeight: z.number().optional(),
  }),
  shape: z.looseObject({
    radius: z.string().optional(),
    borderWidth: z.string().optional(),
    spaceScale: z.number().optional(),
    appWidth: z.string().optional(),
    heroWidth: z.string().optional(),
    // 711-7: elevation of cards — a preset, never a free shadow string.
    shadow: z.enum(["none", "soft", "medium", "strong"]).optional(),
  }),
  // 711-7: the interface's speed; the body branch of 308-1 went with the catalogue (706, 711-7).
  motion: z.looseObject({ speed: z.enum(["none", "fast", "normal", "slow"]).optional() }).optional(),
  // 308-1: первый экран по центру из CONFIG, пиксели (ветка CONFIG `blocks` — имя данных CONFIG).
  blocks: z
    .looseObject({
      heroOneWidth: z.number().optional(),
      heroOneSize: z.looseObject({ mobile: z.number().optional(), tablet: z.number().optional(), desktop: z.number().optional() }).optional(),
    })
    .optional(),
});

export const __designConfigSchemaMatchesType: z.infer<
  typeof designConfigSchema
> extends DesignConfig
  ? true
  : never = true;
