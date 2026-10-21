// ДВЕРЬ НАСТРОЕК ЭЛЕМЕНТА — внутри своей ветки (владелец 2026-10-07: «переносить двери внутрь ветки, а язык в адресе принять как
// цену»): `/<язык>/admin/api/settings/app`. Язык — языка страницы (`<html lang>`), прокси пропускает `/<язык>/…/api/…` без
// переадресации и в режиме одного языка.
export function settingsDoor(): string {
  const lang = (typeof document !== "undefined" && document.documentElement.lang) || "en"
  return `/${lang}/admin/api/settings/app`
}

/** Адрес двери по виду настроек: `app` живёт в ветке (422), `platform` и `design` — на уровне элемента (их зовут ядро и
 *  общий индикатор ширины). Один источник адреса для всех островков — ✗ 425: два места собирали его сами и стучались в 404. */
export function settingsUrl(kind: 'app' | 'platform' | 'design'): string {
  return kind === 'app' ? settingsDoor() : `/api/settings/${kind}`
}
