import type { ReactNode } from 'react'

// ФАБРИКА СТРАНИЦЫ ИЗ БЛОКОВ (элемент «Блоки», шаг 297). Страница — список `{ kind, ...поля }`; набор (`set`) называет
// ТОЛЬКО те блоки, что стоят в этом проекте. Контейнеры (`cards`, `card`) получают вложенные блоки в `children`.
// Блок, которого в наборе нет, — ошибка сборки с командой установки: пустое место на странице хуже громкого отказа.
export type BlockData = { kind: string; bid?: string; children?: BlockData[] | ReactNode; [field: string]: unknown }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BlockSet = Record<string, (props: any) => ReactNode>

function render(b: BlockData, set: BlockSet, key: string): ReactNode {
  const Block = set[b.kind]
  if (!Block) {
    const why = b.kind.startsWith('widget-')
      ? `Widget «${b.kind}» is not in this build: list it in the branch's _widgets/index.tsx and rebuild`
      : `Block «${b.kind}» is not installed in this project: npx shadcn@latest add @fractera/${b.kind}`
    // 426 (✗ 2026-10-07: данные страницы назвали новый виджет раньше пересборки — живая страница ответила 500): громко — только
    // на сборке (там же сторож check:page-sequence); на работающем сайте элемент пропускается с записью в журнал сервера, а
    // страница остаётся целой — данные читаются на ходу, код появится со следующей сборкой.
    if (process.env.NEXT_PHASE === 'phase-production-build') throw new Error(why)
    console.error(`[page-body] ${why} — skipped on this page until the next build`)
    return null
  }
  const { kind, children, bid, ...props } = b
  const kids = Array.isArray(children) ? (children as BlockData[]).map((c, i) => render(c, set, `${key}-${i}`)) : children
  // 317-2: АДРЕС БЛОКА — обёртка `display: contents` (на вёрстку не влияет) с `data-block` (постоянный `bid` из данных) и
  // `data-kind`. По ним подсветка в режиме архитектора называет блок, а самому блоку ничего знать не нужно. `bid` в блок не
  // передаётся: это адрес, а не свойство вида.
  return (
    <div key={key} data-block={typeof bid === 'string' ? bid : undefined} data-kind={kind} style={{ display: 'contents' }}>
      <Block blockKey={key} {...props}>{kids}</Block>
    </div>
  )
}

export function PageBody({ blocks, set }: { blocks: BlockData[]; set: BlockSet }) {
  return <>{blocks.map((b, i) => render(b, set, `b${i}`))}</>
}
