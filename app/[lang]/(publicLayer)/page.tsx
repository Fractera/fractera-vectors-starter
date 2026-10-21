import { rootPage } from '@/lib/branch-page'
import { WIDGETS } from './_widgets'

// Корень публичной ветки — главная. Слова — ./_data/{meta,en,ru}.json; дети ветки — ./_pages/<slug>/, их рисует ./[slug].
const page = rootPage({ segments: ['(publicLayer)'], subPath: '', titleInBody: true, crumbs: false, widgets: WIDGETS })

export const revalidate = 300
export const generateMetadata = page.generateMetadata
export default page.Page
