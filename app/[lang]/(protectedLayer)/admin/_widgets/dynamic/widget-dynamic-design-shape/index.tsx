import { DesignEditorPanel } from "../../../_components/design-editors/panels"
import { SectionTabs } from "../../../_components/section-tabs"
import { designAccessWords } from "../../../_components/design-editors/access-words.i18n"

// 579-1: страница «shape» своей мастерской оформления — редактор, который пишет DESIGN-CONFIG этого элемента.
export function Widget({ lang }: { lang: string }) {
  return (
    <>
      <SectionTabs lang={lang} page="design" current="shape" />
      <DesignEditorPanel lang={lang} section="shape" words={designAccessWords(lang)} />
    </>
  )
}
