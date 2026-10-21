import { MessengerShell } from '@/components/messenger/messenger-shell.client'
import { messengerUi } from '@/components/messenger/messenger.i18n'

// Виджет «widget-dynamic-messenger-h2a» (шаг узла 459): окно H2A Messenger в корне ветки — список бесед (пока пустой).
export function MessengerWidget({ lang }: { lang: string }) {
  return <MessengerShell ui={messengerUi(lang, 'h2a')} />
}
