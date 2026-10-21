// ФРАЗА ДЛЯ ЧЕЛОВЕКА В ОТВЕТЕ A2A (шаг узла 408-6; владелец: «для человека это каракули совершенно не читаемые … Human
// Description»). Ответ навыка собирается кодом, поэтому и фраза — шаблоном, без модели. Кладётся текстовыми частями рядом с
// частью `data`, по одной на язык: `{ text, mediaType: "text/plain", metadata: { lang } }` (`Part.metadata` — `a2a.proto`).
// Лента ядра и Telegram показывают фразу, а данные — свёрнутыми или вложением.

type Json = Record<string, unknown>
type Lang = "en" | "ru"
const LANGS: Lang[] = ["en", "ru"]

const count = (v: unknown) => (Array.isArray(v) ? v.length : 0)

function phrase(skill: string, input: Json, result: Json, lang: Lang): string {
  const ru = lang === "ru"
  const query = String(input.query ?? "").trim()
  if (skill === "catalog-find") {
    const n = count(result.units)
    const sections = count(result.sections)
    if (!query) return ru ? `В каталоге разделов: ${sections}; показываю единиц: ${n}.` : `The catalogue has ${sections} sections; showing ${n} units.`
    if (n === 0) {
      return ru
        ? `По запросу «${query}» в каталоге ничего нет. Можно сделать такой блок и передать мне на сохранение.`
        : `Nothing for «${query}» in the catalogue. You can build such a block and hand it to me to keep.`
    }
    return ru ? `По запросу «${query}» нашлось: ${n}.` : `Found ${n} for «${query}».`
  }
  if (skill === "catalog-get") {
    const unit = (result.unit ?? {}) as Json
    return ru ? `Отдаю «${unit.title ?? unit.address}», версия ${unit.version}.` : `Here is «${unit.title ?? unit.address}», version ${unit.version}.`
  }
  if (skill === "catalog-contribute") {
    const created = result.createdSection ? (ru ? " Раздел создан впервые." : " The section is new.") : ""
    return ru
      ? `Принял и сохранил ${result.address}, версия ${result.version}.${created}`
      : `Accepted and kept ${result.address}, version ${result.version}.${created}`
  }
  if (skill === "site-shell") return ru ? "Отдаю оболочку сайта: шапку, подвал и меню." : "Here is the site shell: header, footer and menu."
  if (skill === "redraw-pages") return ru ? "Страницы сайта перерисованы." : "The site pages are redrawn."
  return ru ? `Навык ${skill} выполнен.` : `Skill ${skill} done.`
}

/** Текстовые части ответа: фраза на каждом языке узла. */
export function humanParts(skill: string, input: Json, result: unknown) {
  const r = (result && typeof result === "object" ? result : {}) as Json
  return LANGS.map((lang) => ({ text: phrase(skill, input, r, lang), mediaType: "text/plain", metadata: { lang } }))
}
