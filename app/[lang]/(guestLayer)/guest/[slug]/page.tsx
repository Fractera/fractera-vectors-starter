import { childRoute } from '@/lib/branch-page'
import { WIDGETS } from '../_widgets'

// Ребёнок гостевой ветки: одна страница на все папки ../_pages/<slug>/ (пока их нет).
const route = childRoute({ segments: ['(guestLayer)', 'guest'], subPath: '/guest', widgets: WIDGETS })

export const revalidate = 300
export const dynamicParams = true
export const generateStaticParams = route.generateStaticParams
export const generateMetadata = route.generateMetadata
export default route.Page
