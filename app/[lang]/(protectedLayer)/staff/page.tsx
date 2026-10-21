import { rootPage } from '@/lib/branch-page'

// Корень ветки «staff» — /<lang>/staff. Слова — ./_data; дети — ./_pages/<slug>/, их рисует ./[slug].
const page = rootPage({ segments: ['(protectedLayer)', 'staff'], subPath: '/staff' })

export const revalidate = 300
export const generateMetadata = page.generateMetadata
export default page.Page
