import { branchRoot, wordsIn } from '@/lib/page-tree'
import { brand } from '@/lib/brand'
import { fillSite, snippetResponse } from '@/lib/snippet/page-snippet'

// Сниппет главной (шаг узла 458-3): заголовок главной, а пуст он — имя сайта; рисуется при первом запросе.
export const revalidate = 300
export const dynamicParams = true
export function generateStaticParams() {
  return []
}
export async function GET(_req: Request, ctx: { params: Promise<{ lang: string }> }) {
  const { lang } = await ctx.params
  const page = branchRoot('(publicLayer)')
  const site = brand().name
  const w = page ? wordsIn(page, lang) : null
  return snippetResponse(fillSite(w?.title, site) || site, fillSite(w?.description, site))
}
