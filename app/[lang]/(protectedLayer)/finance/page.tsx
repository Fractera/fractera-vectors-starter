import { rootPage } from '@/lib/branch-page'

// Корень ветки «finance» — /<lang>/finance. Слова — ./_data; дети — ./_pages/<slug>/, их рисует ./[slug].
const page = rootPage({ segments: ['(protectedLayer)', 'finance'], subPath: '/finance' })

export const revalidate = 300
export const generateMetadata = page.generateMetadata
export default page.Page
