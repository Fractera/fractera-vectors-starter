// @api give every node service the project header and footer data
import { NextResponse } from "next/server"
import { SUPPORTED_LANGUAGES } from "@/config/translations/translations.config"
import { siteShellData } from "@/lib/shell/site-shell-data"

// ОБОЛОЧКА ПРОЕКТА ДЛЯ ВСЕХ СЛУЖБ УЗЛА (шаг 285-3): всё, что рисуют шапка и подвал, — одним объектом.
//
// 🔒 ТА ЖЕ ФУНКЦИЯ, ЧТО У ШАПКИ И ПОДВАЛА САЙТА (`siteShellData`), и тот же вид у служб (`components/shell/`,
// копия сайта байт в байт). Две сборки одних данных разошлись бы молча — это и был «калейдоскоп».
// 🔒 СТАТИЧЕСКАЯ, как `/api/menu`: меню собирается из папок `app/[lang]`, которых standalone-сервер не видит;
// ответ пишется на сборке сайта и меняется с его развёртыванием. Открыта без ключа — она и так на каждой странице.
// Адреса — относительные сайту; служба делает их абсолютными на адрес сайта.
export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((lang) => ({ lang }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return NextResponse.json(siteShellData(lang))
}
