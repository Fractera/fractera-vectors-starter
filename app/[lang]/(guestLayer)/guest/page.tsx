import { rootPage } from '@/lib/branch-page'
import { WIDGETS } from './_widgets'

// Корень гостевой ветки — /<lang>/guest: текст и тревожная карточка (блок warning-card из «Блоков»). Слова — ./_data.
const page = rootPage({ segments: ['(guestLayer)', 'guest'], subPath: '/guest', widgets: WIDGETS })

export const revalidate = 300
export const generateMetadata = page.generateMetadata
export default page.Page
