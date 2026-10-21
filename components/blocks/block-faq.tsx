import { H2 } from '@/components/ui/typography'
import { inline } from '@/lib/blocks/inline'

// ВОПРОСЫ И ОТВЕТЫ + разметка FAQPage — один источник для видимого блока и для машины: закрыть одно, оставив другое,
// значит пообещать поисковику то, чего на странице нет. Ответ проходит через `inline` (ссылка внутри фразы), вопрос — нет.
export type FaqProps = { blockKey?: string; title: string; items: { q: string; a: string }[] }

const plain = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

export function Faq({ blockKey: k = 'faq', title, items }: FaqProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })),
  }
  return (
    <section aria-labelledby="faq-heading" className="mt-12 border-t border-border pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <H2 id="faq-heading">{title}</H2>
      <dl className="mt-6 flex flex-col gap-4">
        {items.map((f, i) => (
          <div key={`${k}-${i}`} className="rounded-2xl border border-border bg-muted/40 p-5">
            <dt className="text-base font-semibold text-foreground">{f.q}</dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{inline(f.a, `${k}-${i}`)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
