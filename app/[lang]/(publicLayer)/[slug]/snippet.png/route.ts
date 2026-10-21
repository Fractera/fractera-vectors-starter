import { branchChild, wordsIn } from '@/lib/page-tree'
import { brand } from '@/lib/brand'
import { fillSite, snippetResponse } from '@/lib/snippet/page-snippet'

// Сниппет любого ребёнка публичной ветки (шаг узла 458-3): рисуется при первом запросе, 5 минут готовый — как сама страница.
export const revalidate = 300
export const dynamicParams = true
export function generateStaticParams() {
  return []
}
export async function GET(_req: Request, ctx: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await ctx.params
  const page = branchChild(['(publicLayer)'], slug)
  if (!page) return new Response('Not found', { status: 404 })
  const w = wordsIn(page, lang)
  const site = brand().name
  return snippetResponse(fillSite(w.title, site), fillSite(w.description, site))
}
