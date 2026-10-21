import type { MetadataRoute } from "next";
import { getAppConfig } from "@/config/app-config";
import { SUPPORTED_LANGUAGES } from "@/config/translations/translations.config";
import { isShowcaseBuild } from "@/lib/showcase.server";

// Static robots (step 131). Config-driven so it stays correct under white-label:
// indexing toggle, disallow paths and sitemap URL come from Site Settings
// (getAppConfig). Architect-only service routes are disallowed here too (they are
// also noindex via the (service) layout metadata).
export const dynamic = "force-static";
export const revalidate = 86_400;

// 🛑 СЛОЙ АРХИТЕКТОРА ДОБАВЛЕН В 255, И ЭТО БЫЛА ДЫРА, А НЕ УПУЩЕНИЕ СТИЛЯ.
// Измерено: `/ru/architect/tools` отдавал `robots: index, follow` — то есть пульт
// узла (домен, подписка, терминал, состав инструментов) был открыт поисковику.
// Мета-тег `noindex` ставит `_lib/collection-metadata.ts`, но одного его мало: тег
// читает лишь тот робот, который страницу уже загрузил, а эта строка не пускает
// его на адрес вовсе.
//
// 🪦 ДЕВЯТЬ ПУТЕЙ УДАЛЕНЫ 2026-09-20 (256-7) — ОНИ ВЕЛИ В ПУСТОТУ. Здесь стояли
// `/ai-core`, `/ai-draft-settings`, `/dashboard`, `/debug`, `/development-steps`,
// `/documents`, `/glossary`, `/patterns`, `/project` — остатки прежней линии
// проекта, приехавшие в стартер. Проверено обходом дерева: **маршрута нет ни у
// одного**. Запрет несуществующего не защищает ничего и мешает главному: длинный
// список читается как «тут всё продумано», и настоящая дыра в нём не видна.
//
// 🛑 `/architecture` УДАЛЁН ОТТУДА ЖЕ, И ЭТО БЫЛ НАСТОЯЩИЙ ДЕФЕКТ. Это **публичная
// страница продукта** на 480 строк, которая в той же сборке стоит в карте сайта:
// `robots.txt` запрещал то, что `sitemap.xml` обещал. Сегодня не стреляло лишь
// потому, что адреса языковые (`/ru/architecture`), а правила robots префиксные, —
// то есть один дефект прикрывал другой. Включи владелец одноязычный режим, и
// описание продукта молча исчезло бы из индекса.
const SERVICE_DISALLOW = ["/architect"];

// 🪦 КАРТА ТОВАРОВ УДАЛЕНА ВМЕСТЕ С МАГАЗИНОМ (229-3, 2026-09-18). Здесь
// перечислялись порции /products/sitemap/<N>.xml — предмета у них больше нет.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const cfg = getAppConfig();
  const base = cfg.seo?.sitemapUrl ?? `${cfg.url}/sitemap.xml`;
  const sitemapUrl = [base];
  // 🛑 СЛУЖЕБНЫЕ ПУТИ РАСКРЫВАЮТСЯ ПО ВКЛЮЧЁННЫМ ЯЗЫКАМ (256-7).
  //
  // ✗ ИЗМЕРЕНО: строка `Disallow: /architect` НЕ ЗАКРЫВАЕТ `/ru/architect`.
  // Правила robots.txt работают по ПРЕФИКСУ, а все страницы живут за языковым
  // сегментом. То есть запрет стоял, выглядел исполненным и не защищал ничего —
  // худший вид дефекта: он снимает тревогу, не снимая причины.
  //
  // Раскрытие идёт по включённому набору, поэтому новый язык добавляет строку сам,
  // без правки кода. Голый путь остаётся тоже: одноязычный режим убирает сегмент.
  //
  // 🔒 НА ВИТРИНЕ СЛУЖЕБНЫХ ЗАПРЕТОВ НЕТ (256-2): там слой архитектора открыт
  // намеренно и обязан индексироваться — иначе мы обещаем поисковику страницы,
  // которые сами же запретили.
  const servicePaths = isShowcaseBuild()
    ? []
    : SERVICE_DISALLOW.flatMap(p => [p, ...SUPPORTED_LANGUAGES.map(l => `/${l}${p}`)]);
  const disallow = [...(cfg.seo?.disallowPaths ?? []), ...servicePaths];
  const isAllowed = cfg.seo?.indexing !== "disallow";
  // Icons cut from the own logo live under `/api` (node step 413): the longer Allow wins over `Disallow: /api`, so a search
  // engine can take the favicon for its results — Google takes a favicon only from what it may crawl.
  const allow = ["/", "/api/config-image/icon-"];

  // 🔒 БЕЗ ПОСТОЯННОГО АДРЕСА САЙТ НЕ ИНДЕКСИРУЕТСЯ ВОВСЕ (256-4).
  //
  // ✗ ИЗМЕРЕНО 2026-09-20, и это было хуже, чем выглядело: при пустом `cfg.url`
  // файл печатал `Allow: /` и строку `Sitemap: /sitemap.xml` — относительный
  // адрес, недействительный для robots.txt. То есть узел, живущий на быстром
  // туннеле, ПРИГЛАШАЛ поисковика; а этот адрес сменился вчера шестой раз за
  // сутки.
  //
  // 🛑 ЧЕМ ЭТО ПЛАТИТСЯ. Имя туннеля живёт часы. Попав в индекс, оно оставляет
  // за собой дубли и мёртвые адреса, которые достанутся будущему настоящему
  // домену — тому самому, ради которого всё и строится. Индексироваться имеет
  // право лишь то, что собирается жить.
  //
  // 🔒 ПОПУТНО ЭТО ЗАКРЫВАЕТ СЛОЙ АРХИТЕКТОРА НА ТУННЕЛЕ: он там открыт по
  // решению 242, и до этой правки robots.txt звал туда поисковика.
  //
  // Строка `Sitemap` здесь не печатается намеренно: карты у сайта без адреса
  // нет (`app/sitemap.ts` отдаёт пустой список по той же причине).
  if (!cfg.url) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  if (!isAllowed) {
    return { rules: [{ userAgent: "*", disallow: "/" }], sitemap: base };
  }

  return {
    rules: [
      { userAgent: "Googlebot", allow, disallow },
      { userAgent: "Bingbot", allow, disallow, crawlDelay: 1 },
      { userAgent: "GPTBot", allow, disallow, crawlDelay: 1 },
      // 431 (владелец 2026-10-07: «Разрешить, как другим»): токен Google — учится ли Gemini на страницах; на поиск не влияет.
      { userAgent: "Google-Extended", allow, disallow },
      { userAgent: "OAI-SearchBot", allow, disallow },
      { userAgent: "ChatGPT-User", allow, disallow },
      { userAgent: "anthropic-ai", allow, disallow, crawlDelay: 1 },
      { userAgent: "ClaudeBot", allow, disallow, crawlDelay: 1 },
      { userAgent: "PerplexityBot", allow, disallow, crawlDelay: 1 },
      { userAgent: "*", allow, disallow, crawlDelay: 1 },
    ],
    sitemap: sitemapUrl,
    host: cfg.url,
  };
}
