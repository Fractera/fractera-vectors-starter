// 579-1: серверная обёртка своего редактора оформления — `DesignEditorPanel`.
// Адреса дают отсюда, из окружения узла; слова раздела выбирает СЕРВЕР — словарь в браузер целиком не едет.
import { DesignEditorIsland, type DesignSection } from './design-editor.client'
import { designUi } from './design.i18n'
import type { AccessWords } from './settings-access'
import { ownId } from '@/lib/own-id'

const SITE = (process.env.PROJECT_SITE_URL ?? '').replace(/\/+$/, '')
const CORE = (process.env.ARCHITECT_URL ?? '').trim().replace(/\/+$/, '')
const loginHref = (lang: string) => (SITE ? `${SITE}/login?lang=${lang}` : undefined)
// Нет адреса ядра — ссылок нет: ссылка в никуда хуже её отсутствия.

export function DesignEditorPanel({ lang, section, words }: { lang: string; section: DesignSection; words: AccessWords }) {
  const all = designUi(lang)
  return (
    <DesignEditorIsland
      section={section}
      ui={{ colors: all.colors, fonts: all.fonts, type: all.type, shape: all.shape }}
      words={words}
      loginHref={loginHref(lang)}
    />
  )
}
