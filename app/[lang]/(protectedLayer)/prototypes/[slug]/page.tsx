import { prototypeRoute } from '../_components/prototype-page'

// Ребёнок ветки «Прототипы дизайна» (711-4): один маршрут на все папки ../_pages/<id>/; обёртка с копией токенов — ../_components.
const route = prototypeRoute()

export const revalidate = 60
export const dynamicParams = true
export const generateStaticParams = route.generateStaticParams
export const generateMetadata = route.generateMetadata
export default route.Page
