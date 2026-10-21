import type { Metadata } from 'next'
import { MessengerShell } from './messenger-shell.client'
import { messengerUi, type MessengerKind } from './messenger.i18n'
import { PageShell } from '@/components/content-page/page-shell'

// МАРШРУТ ОДНОЙ БЕСЕДЫ мессенджера H2A (шаг узла 459): `/<lang>/messenger-<kind>/<беседа>`. Общий для обеих веток —
// маршрут ветки только объявляет сегмент и зовёт этот вход (сторож check-protected: «тонкий маршрут»).
// Сегодня — окно пустой беседы на ai-elements: отправки и хранения нет.
export function conversationRoute(kind: MessengerKind) {
  async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    const ui = messengerUi(lang, kind)
    return { title: `${ui.title} · ${ui.conversation}`, robots: { index: false, follow: false } }
  }
  async function Page({ params }: { params: Promise<{ lang: string; slug: string[] }> }) {
    const { lang, slug } = await params
    return (
      <PageShell top="content">
        <MessengerShell ui={messengerUi(lang, kind)} conversation={slug.join('/')} heading="h1" />
      </PageShell>
    )
  }
  return { generateMetadata, Page }
}
