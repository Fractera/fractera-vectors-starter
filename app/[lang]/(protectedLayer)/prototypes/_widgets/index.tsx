import type { ReactNode } from 'react'
import { Widget as PrototypesList } from './dynamic/widget-dynamic-prototypes-list'

// Виджеты ветки «Прототипы дизайна» (узел, шаг 711-4).
export const WIDGETS: Record<string, (lang: string) => ReactNode> = {
  'widget-dynamic-prototypes-list': (lang) => <PrototypesList lang={lang} />,
}
