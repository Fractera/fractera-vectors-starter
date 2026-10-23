import { BlockSectionPage } from '../../_components/element-blocks-pages'

// Раздел блоков элемента (577-11): `/<язык>/admin/blocks/<раздел>`; вход — `../../_components/element-blocks-pages.tsx`.
export const revalidate = 300
export const dynamicParams = true
export function generateStaticParams() { return [] }
export const metadata = { robots: { index: false, follow: false } }

export default async function Page({ params }: { params: Promise<{ lang: string; section: string }> }) {
  const { lang, section } = await params
  return <BlockSectionPage lang={lang} section={section} />
}
