import { childRoute } from '@/lib/branch-page'
import { WIDGETS } from '../_widgets'

// Ребёнок публичной ветки: одна страница на все папки ../_pages/<slug>/. Рисуется при первом заходе, 5 минут готовый.
const route = childRoute({ segments: ['(publicLayer)'], subPath: '', widgets: WIDGETS })

export const revalidate = 300
export const dynamicParams = true
export const generateStaticParams = route.generateStaticParams
export const generateMetadata = route.generateMetadata
export default route.Page
