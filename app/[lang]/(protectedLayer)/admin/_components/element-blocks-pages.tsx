import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/nav/breadcrumbs.server'
import { renderBlocks, BLOCK_SET } from '@/lib/content/blocks/registry'
import type { Block } from '@/lib/content/blocks/types'
import { H1, P } from '@/components/ui/typography'
import { branchChild, wordsIn } from '@/lib/page-tree'
import { blockSections, sectionOf, sectionTitle, previewNode, registeredBlocks, UNSORTED } from '../_libs/element-blocks'
import { ElementBlocks } from '../_widgets/static/widget-static-element-blocks'
import { elementBlocksUi } from '../_widgets/static/widget-static-element-blocks/ui.i18n'

// СТРАНИЦЫ РАЗДЕЛА И PREVIEW БЛОКОВ ЭЛЕМЕНТА (577-11) — входы тонких маршрутов `../blocks/[section]/page.tsx` и
// `../blocks/[section]/[name]/page.tsx`. Владелец 2026-10-23: Preview — «один единственный элемент больше ничего за исключение хлебных
// крошек чтобы пользователь вернуться назад»; разделы — папки `_pages/blocks/<раздел>/README.md`, адрес `/<язык>/admin/blocks/<раздел>`.
// Обе страницы рисуются при первом заходе и перерисовываются раз в 5 минут — новые блоки и разделы видны без развёртывания.

function listPage() {
  const page = branchChild(['(protectedLayer)', 'admin'], 'blocks')
  if (!page) notFound()
  return page
}
const known = (section: string) => section === UNSORTED || blockSections().some((s) => s.id === section)

export function BlockSectionPage({ lang, section }: { lang: string; section: string }) {
  const page = listPage()
  if (!known(section)) notFound()
  const s = blockSections().find((x) => x.id === section)
  const title = sectionTitle(section, lang)
  return (
    <main data-block="ebs01" data-app-column className="mx-auto w-full max-w-5xl flex-1 px-6 pt-[var(--page-py-work)] pb-[var(--page-py-content)]">
      <Breadcrumbs lang={lang} trail={[{ label: wordsIn(page, lang).title, href: `/${lang}/admin/blocks` }, { label: title }]} />
      <H1 data-block="ebs02" className="mt-6">{title}</H1>
      {s?.purpose && <P data-block="ebs03" className="mt-2 text-muted-foreground">{s.purpose}</P>}
      <div data-block="ebs04" className="mt-8"><ElementBlocks lang={lang} section={section} /></div>
    </main>
  )
}

export function BlockPreviewPage({ lang, section, name }: { lang: string; section: string; name: string }) {
  const page = listPage()
  if (!registeredBlocks().includes(name) || sectionOf(name) !== section) notFound()
  const ui = elementBlocksUi(lang)
  const node = name in BLOCK_SET ? previewNode(name, lang) : null
  return (
    <main data-block="ebp01" data-app-column className="mx-auto w-full max-w-5xl flex-1 px-6 pt-[var(--page-py-work)] pb-[var(--page-py-content)]">
      <Breadcrumbs
        lang={lang}
        trail={[
          { label: wordsIn(page, lang).title, href: `/${lang}/admin/blocks` },
          { label: sectionTitle(section, lang), href: `/${lang}/admin/blocks/${section}` },
          { label: name },
        ]}
      />
      <div data-block="ebp02" className="mt-8">
        {node ? renderBlocks([node as unknown as Block], `pv-${name}`) : <P data-block="ebp03">{name in BLOCK_SET ? ui.previewEmpty : ui.waitsBuild}</P>}
      </div>
    </main>
  )
}
