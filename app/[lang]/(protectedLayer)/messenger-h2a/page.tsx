import { rootPage } from '@/lib/branch-page'
import { WIDGETS } from './_widgets'

// Корень ветки «messenger-h2a» — /<lang>/messenger-h2a: список бесед (H2A Messenger). Слова — ./_data, окно — виджет ветки (ai-elements).
const page = rootPage({ segments: ['(protectedLayer)', 'messenger-h2a'], subPath: '/messenger-h2a', widgets: WIDGETS })

export const revalidate = 300
export const generateMetadata = page.generateMetadata
export default page.Page
