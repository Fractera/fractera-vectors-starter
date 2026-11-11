import type { ReactNode } from 'react'
import { SECTIONS } from './index'
import { TEXT_SET } from '@/lib/content/text-set'

// ФАБРИКА СТРАНИЦЫ ИЗ СЕКЦИЙ (шаг 297; секции — собственный код элемента). Страница — список `{ kind, ...поля }`; набор (`set`) называет
// ТОЛЬКО те виды, что стоят в этом проекте. Контейнеры (`cards`, `card`) получают вложенные части в `children`.
// Вид, которого в наборе нет, — громкая ошибка: пустое место на странице хуже громкого отказа.
export type ItemData = { kind: string; bid?: string; children?: ItemData[] | ReactNode; [field: string]: unknown }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KindSet = Record<string, (props: any) => ReactNode>

function render(b: ItemData, set: KindSet, key: string): ReactNode {
  const Draw = set[b.kind]
  if (!Draw) {
    const why = b.kind.startsWith('widget-')
      ? `Widget «${b.kind}» is not in this build: list it in the branch's _widgets/index.tsx and rebuild`
      : `Section «${b.kind}» is not in this element's set: write its folder components/sections/${b.kind}/, list it in components/sections/index.ts and rebuild`
    // 426 (✗ 2026-10-07: данные страницы назвали новый виджет раньше пересборки — живая страница ответила 500): громко — только
    // на сборке (там же сторож check:page-sequence); на работающем сайте элемент пропускается с записью в журнал сервера, а
    // страница остаётся целой — данные читаются на ходу, код появится со следующей сборкой.
    if (process.env.NEXT_PHASE === 'phase-production-build') throw new Error(why)
    console.error(`[page-body] ${why} — skipped on this page until the next build`)
    return null
  }
  const { kind, children, bid, ...props } = b
  const kids = Array.isArray(children) ? (children as ItemData[]).map((c, i) => render(c, set, `${key}-${i}`)) : children
  // 317-2: АДРЕС ЧАСТИ СТРАНИЦЫ — обёртка `display: contents` (на вёрстку не влияет) с `data-block` (постоянный `bid` из данных) и
  // `data-kind`. По ним подсветка в режиме архитектора называет её, а самой секции ничего знать не нужно. `bid` в компонент не
  // передаётся: это адрес, а не свойство вида.
  return (
    <div key={key} data-block={typeof bid === 'string' ? bid : undefined} data-kind={kind} style={{ display: 'contents' }}>
      <Draw itemKey={key} {...props}>{kids}</Draw>
    </div>
  )
}

export function PageBody({ body, set }: { body: ItemData[]; set: KindSet }) {
  return <>{body.map((b, i) => render(b, set, `b${i}`))}</>
}

// 717-2: what `components/sections/index.ts` did — the sections of this element (`./index.ts`), the element's typography and the
// branch's widgets, drawn in the order of the page's body; `keyPrefix` keeps the keys unique between calls on one page.
export const SECTION_SET: KindSet = Object.fromEntries(Object.entries(SECTIONS).map(([kind, m]) => [kind, m.Section]))

export function renderPage(body: ItemData[], keyPrefix = 'blk', widgets?: KindSet): ReactNode {
  return <PageBody key={keyPrefix} body={body} set={{ ...SECTION_SET, ...TEXT_SET, ...(widgets ?? {}) }} />
}
