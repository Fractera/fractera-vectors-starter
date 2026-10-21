import { markdownRoute } from '@/lib/aio/md-route'

// Markdown-двойник любого ребёнка публичной ветки (для агентов): один файл вместо файла на страницу.
export const revalidate = 300
export const dynamicParams = true
export function generateStaticParams() {
  return []
}
export async function GET(req: Request, ctx: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await ctx.params
  return markdownRoute(`/${slug}`).GET(req, { params: Promise.resolve({ lang }) })
}
