import type { ReactNode } from 'react'
import { MessengerWidget } from './dynamic/widget-dynamic-messenger-h2a'

// Виджеты ветки «messenger-h2a» (шаг узла 459): окно мессенджера на ai-elements — одно на корень ветки.
export const WIDGETS: Record<string, (lang: string) => ReactNode> = {
  'widget-dynamic-messenger-h2a': (lang) => <MessengerWidget lang={lang} />,
}
