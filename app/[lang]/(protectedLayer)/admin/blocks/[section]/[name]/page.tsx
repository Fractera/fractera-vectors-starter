import { BlockPreviewPage } from '../../../_components/element-blocks-pages'

// Preview одного блока элемента (577-11): `/<язык>/admin/blocks/<раздел>/<блок>`; вход — `../../../_components/element-blocks-pages.tsx`.
export const revalidate = 300
export const dynamicParams = true
export function generateStaticParams() { return [] }
export const metadata = { robots: { index: false, follow: false } }

export default async function Page({ params }: { params: Promise<{ lang: string; section: string; name: string }> }) {
  const { lang, section, name } = await params
  return <BlockPreviewPage lang={lang} section={section} name={name} />
}
