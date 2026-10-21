import { childRoute } from '@/lib/branch-page'

// Ребёнок ветки «finance»: одна страница на все папки ../_pages/<slug>/; замок — роли из его meta.json.
const route = childRoute({ segments: ['(protectedLayer)', 'finance'], subPath: '/finance' })

export const revalidate = 300
export const dynamicParams = true
export const generateStaticParams = route.generateStaticParams
export const generateMetadata = route.generateMetadata
export default route.Page
