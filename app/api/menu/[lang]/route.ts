// @api give every service of the node the project menu in one language
import { NextResponse } from "next/server"
import { SUPPORTED_LANGUAGES } from "@/config/translations/translations.config"
import { resolveTopGroups, resolveFooterGroups } from "@/lib/menu/site-menu"
import { getAppConfig } from "@/config/app-config"

// МЕНЮ ПРОЕКТА ДЛЯ ВСЕХ СЛУЖБ УЗЛА (шаг 283-1).
//
// 🔒 СТАТИЧЕСКАЯ ДВЕРЬ, И ЭТО НЕ ЭКОНОМИЯ. Меню собирается из манифестов групп в папках `app/[lang]`, а
// standalone-сервер этих папок в работе не видит: на запросе ответ был бы пустым. Поэтому JSON собирается
// на СБОРКЕ сайта, по файлу на язык, — и меняется вместе с развёртыванием сайта, как и всё его оформление.
//
// Открыта без ключа: меню публично, оно и так нарисовано на каждой странице сайта. Адреса — относительно
// сайта (`/ru/m2m`); служба, рисующая меню у себя, делает их абсолютными на адрес сайта.
//
// `brand` (283-4) — имя проекта, то же `short_name`, что сайт рисует в своей шапке и подвале: службы не
// держат своей копии имени, иначе переименование проекта расходится по службам молча.
export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((lang) => ({ lang }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const brand = getAppConfig().short_name ?? ""
  return NextResponse.json({ lang, brand, top: resolveTopGroups(lang), footer: resolveFooterGroups(lang) })
}
