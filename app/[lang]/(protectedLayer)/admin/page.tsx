import { rootPage } from '@/lib/branch-page'
import { WIDGETS } from './_widgets'

// Корень ветки «admin» — /<lang>/admin. Слова — ./_data; дети — ./_pages/<slug>/, их рисует ./[slug].
const page = rootPage({ segments: ['(protectedLayer)', 'admin'], subPath: '/admin', widgets: WIDGETS })

export const revalidate = 300
export const generateMetadata = page.generateMetadata
export default page.Page
