import { rootPage } from '@/lib/branch-page'
import { WIDGETS } from './_widgets'

// Корень ветки «Прототипы дизайна» — /<lang>/prototypes (узел, шаг 711-4). Слова — ./_data; прототипы — ./_pages/<id>/, их рисует
// ./[slug] со своей копией токенов.
const page = rootPage({ segments: ['(protectedLayer)', 'prototypes'], subPath: '/prototypes', widgets: WIDGETS })

export const revalidate = 60
export const generateMetadata = page.generateMetadata
export default page.Page
