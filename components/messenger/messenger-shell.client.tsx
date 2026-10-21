'use client'

import { MessagesSquare } from 'lucide-react'
import { Conversation, ConversationContent, ConversationEmptyState } from '@/components/ai-elements/conversation'
import { H1, H2, Small } from '@/components/ui/typography'
import type { MessengerUi } from './messenger.i18n'

// ОКНО МЕССЕНДЖЕРА H2A (шаг узла 459). Владелец 2026-10-12: «Внутри будет динамическая маршрутизации которые последствия будет
// показывать и хранить сообщения» и «жёстко требовать ограничения на использование в дизайне ui/ux только библиотеке ai-elements».
// 🔒 ИНТЕРФЕЙС — ТОЛЬКО ИЗ `components/ai-elements/` (навык `ai-elements`): беседа, сообщения, поле ввода. Своих примитивов чата нет.
// Сегодня — только устройство: список бесед и беседа пусты, отправки и хранения нет (строятся отдельным шагом; таймеров и опроса нет).
// Заголовок окна: в корне ветки H1 ставит фабрика страницы (rootPage) — окно пишет h2; в беседе H1 ставит само окно.
export function MessengerShell({ ui, conversation, heading = 'h2' }: { ui: MessengerUi; conversation?: string; heading?: 'h1' | 'h2' }) {
  const title = conversation ? `${ui.title} · ${ui.conversation}` : ui.title
  return (
    <section data-block="ms459" className="flex min-h-[60vh] flex-col rounded-2xl border border-border">
      <div data-block="ms460" className="border-b border-border px-5 py-4">
        {heading === 'h1' ? <H1 data-block="twmhw">{title}</H1> : <H2 data-block="zbv3p" variant="ui">{title}</H2>}
        <Small data-block="a53cx">{ui.lead}</Small>
      </div>
      <Conversation className="flex-1">
        <ConversationContent>
          <ConversationEmptyState
            icon={<MessagesSquare className="size-8" />}
            title={conversation ? ui.noMessages : ui.empty}
            description={conversation ? ui.noMessagesNote : ui.emptyNote}
          />
        </ConversationContent>
      </Conversation>
    </section>
  )
}
