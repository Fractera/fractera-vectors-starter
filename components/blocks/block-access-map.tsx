import { Eye, EyeOff, Lock } from 'lucide-react'
import { H3, P, Small } from '@/components/ui/typography'
import { inline } from '@/lib/blocks/inline'
import { SectionHead } from '@/components/blocks/block-section-head'

// КТО ЧТО ВИДИТ: одна рамка того, кто видит всё, и внутри неё плитки, каждая видит только своё (узел, шаг 650-3).
// Владелец 2026-11-05: «схематически изобразите как память администратора доступно семь а внутри элементы доступны только свою
// пространство». Готовой схемы вложенности в каталоге не было: `block-flow` — шаги по очереди, `orbit-layers` — слои в движении.
// Слова блока общие: тот же блок рисует роли, папки или любые «один видит всё, каждый — своё».
// 🔒 Без скрипта и без своих цветов: тон `access` и токены «Дизайна»; плитки — сетка, на телефоне столбиком; надпись между
// плитками — одна строка под ними (линия между плитками на узком экране легла бы поперёк текста).
type Tile = { title: string; text: string }
export type AccessMapProps = {
  blockKey?: string
  badge?: string
  title: string
  note?: string
  outer: Tile
  spaces: Tile[]
  between?: string
}

// Число колонок — статичным классом: Tailwind собирает только написанные целиком имена.
const COLS: Record<number, string> = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4', 5: 'sm:grid-cols-2 lg:grid-cols-5', 6: 'sm:grid-cols-3' }

export function AccessMap({ blockKey: k = 'access-map', badge, title, note, outer, spaces, between }: AccessMapProps) {
  return (
    <section data-block="tybry" aria-labelledby={`${k}-t`} className="my-10">
      <SectionHead id={`${k}-t`} badge={badge} title={title} note={note ? inline(note, `${k}-n`) : undefined} />
      <div data-block="poy9f" className="mt-8 rounded-3xl border-2 border-tone-access/40 bg-gradient-to-b from-tone-access/10 to-transparent p-5 md:p-8">
        <div data-block="iu2p0" className="flex items-start gap-3">
          <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tone-access/15 text-tone-access">
            <Eye className="size-5" />
          </span>
          <div data-block="bup4l" className="flex flex-col gap-1">
            <H3 data-block="y0nea">{outer.title}</H3>
            <P data-block="dtq4b">{inline(outer.text, `${k}-o`)}</P>
          </div>
        </div>
        <ul data-block="j0vce" className={`mt-6 grid list-none gap-4 p-0 ${COLS[spaces.length] ?? 'sm:grid-cols-3'}`}>
          {spaces.map((s, i) => (
            <li data-block="k2xnj" key={`${k}-${i}`} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
              <span aria-hidden className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Lock className="size-4" />
              </span>
              <H3 data-block="tybr1">{s.title}</H3>
              <P data-block="poy91">{inline(s.text, `${k}-${i}`)}</P>
            </li>
          ))}
        </ul>
        {between ? (
          <Small data-block="iu2p1" className="mt-4 flex items-center gap-2">
            <EyeOff aria-hidden className="size-4 shrink-0" />
            <span>{inline(between, `${k}-b`)}</span>
          </Small>
        ) : null}
      </div>
    </section>
  )
}
