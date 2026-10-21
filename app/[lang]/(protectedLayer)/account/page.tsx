import { rootPage } from '@/lib/branch-page'

// Корень ветки «account» — /<lang>/account. Слова — ./_data; дети — ./_pages/<slug>/, их рисует ./[slug].
const page = rootPage({ segments: ['(protectedLayer)', 'account'], subPath: '/account' })

export const revalidate = 300
export const generateMetadata = page.generateMetadata
export default page.Page
