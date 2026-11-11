import type { ReactNode } from 'react'
import Link from 'next/link'

// РАЗМЕТКА ВНУТРИ СТРОКИ: **жирный**, *курсив*, `код` и [ссылка](адрес). Внешняя ссылка открывается в новой вкладке.
// Шаг узла 458-4: документы Lagrix несут курсив и код в строке — без них текст шёл со звёздочками и обратными кавычками.
// 🔒 Ссылка внутри сайта (адрес с «/») — `Link`: мягкий переход без перезагрузки, навык soft-navigation (шаг 455).
const LINK_CLASS = 'font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary'

export function inline(text: string, kp: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*([^*\s][^*]*?)\*/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const key = `${kp}-${i}`
    if (m[1] !== undefined) {
      nodes.push(<strong key={key} className="font-semibold text-foreground">{inline(m[1], key)}</strong>)
    } else if (m[2] !== undefined) {
      const href = m[3]
      const label = inline(m[2], key)
      if (href.startsWith('/') && !href.startsWith('//')) {
        nodes.push(<Link key={key} href={href} className={LINK_CLASS}>{label}</Link>)
      } else {
        const external = /^https?:\/\//.test(href)
        nodes.push(
          <a key={key} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={LINK_CLASS}>
            {label}
          </a>,
        )
      }
    } else if (m[4] !== undefined) {
      nodes.push(<code key={key} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">{m[4]}</code>)
    } else {
      nodes.push(<em key={key}>{inline(m[5], key)}</em>)
    }
    last = re.lastIndex
    i++
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}
