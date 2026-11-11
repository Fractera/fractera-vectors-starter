import { DesignBrief } from "../../../_components/design-editors/design-brief.client"
import { briefWords } from "../../../_components/design-editors/design-brief.i18n"

// 706-4: бриф дизайна — первым на странице «Дизайн» элемента, над шрифтами и цветами (владелец 2026-11-09: «На вкладке дизайн создать Бриф»).
export function Widget({ lang }: { lang: string }) {
  return <DesignBrief lang={lang} words={briefWords(lang)} />
}
