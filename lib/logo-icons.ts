// Icons of the page head and the manifest cut from the element's own logo (node step 413, owner 2026-10-11:
// «у каждого элемента есть свой файл конфигурации если в нём настройка есть то берём оттуда если нет то берём из ядра»).
//
// Order, the same everywhere: a cut set (`iconSet`, the settings page makes it from an uploaded picture) → the element's own
// `logo` from APP-CONFIG → the shipped mark of the node (`cfg.icons`, the Fractera mark in `public/icons/`).
// Before this the head and the manifest pointed at the shipped files whenever `iconSet` was empty, so an element with its own
// logo still showed the Fractera mark in the browser tab — only `/favicon.ico` followed the logo.

import type { AppConfig } from "@/config/app-config.defaults"

/** Sizes the head and the manifest ask for. A size outside the list is refused by the door. */
export const LOGO_ICON_SIZES = [32, 48, 180, 192, 512] as const
export type LogoIconSize = (typeof LOGO_ICON_SIZES)[number]

/** The address of one icon cut from the logo: `/api/config-image/icon-<size>` (the door decides per request). */
export function logoIconUrl(size: LogoIconSize): string {
  return `/api/config-image/icon-${size}`
}

/** True when the head must take the icons from the element's own logo. */
export function usesLogoIcons(cfg: AppConfig): boolean {
  return !cfg.iconSet && !!iconSource(cfg)
}

/** The picture the icons are cut from: the square mark (step 452) or the logo. */
export function iconSource(cfg: AppConfig): string | null {
  const mark = typeof cfg.iconMark === "string" && cfg.iconMark.length > 0 ? cfg.iconMark : null
  const logo = typeof cfg.logo === "string" && cfg.logo.length > 0 ? cfg.logo : null
  return mark ?? logo
}

/** `icon-192` → 192; anything else → null. */
export function parseLogoIconSlot(raw: string): LogoIconSize | null {
  const m = /^icon-(\d+)$/.exec(raw)
  if (!m) return null
  const n = Number(m[1])
  return (LOGO_ICON_SIZES as readonly number[]).includes(n) ? (n as LogoIconSize) : null
}
