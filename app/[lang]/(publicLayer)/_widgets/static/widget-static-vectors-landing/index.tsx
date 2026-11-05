import { Check, CornerDownLeft, Cpu, Database, Search, Send, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { AccessMap } from "@/components/blocks/block-access-map"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { H1, H2, H3, Lead, P, Small } from "@/components/ui/typography"
import { inline } from "@/lib/blocks/inline"
import type { Block } from "@/lib/content/blocks/types"
import { TEXT_SET } from "@/lib/content/text-set"
import { cn } from "@/lib/utils"
import { landing, type Hero, type Section } from "./words"

// ГЛАВНАЯ ВЕКТОРНОГО ХРАНИЛИЩА — ЛЕНДИНГ ПО ОБРАЗЦУ STRIPE (узел, шаг 650-4). Владелец 2026-11-05: «ты обязан взять образец landing
// для платёжной системы stripe , выполнить единый стили … Все страницы должны быть в одном стиле … как оформление так и текстов».
// Устройство — как у главной Stripe (шаг 573-7) и памяти (шаг 602): страница рисует себя из своих блоков данных (`words.ts`); раздел —
// `block-section-head` и блоки до следующего, вид раздела выбирается по его `id`, незнакомый `id` — общим видом. Вид — токены
// «Дизайна», shadcn и типографика. Утверждения страницы — только о построенном, сверены с README элемента.

// Пересечение, а не `Extract`: у `text-p | text-lead | text-small | text-code` один член объединения на четыре вида, и `Extract`
// по одному виду дал бы `never`.
type Of<K extends Block["kind"]> = Block & { kind: K }
const first = <K extends Block["kind"]>(s: Section, kind: K) => s.blocks.find((b): b is Of<K> => b.kind === kind)
const all = <K extends Block["kind"]>(s: Section, kind: K) => s.blocks.filter((b): b is Of<K> => b.kind === kind)

const WRAP = "mx-auto w-full max-w-6xl px-6"
const ROUTE_ICONS = [Send, Cpu, Database, Search]

export function VectorsLanding({ lang }: { lang: string }) {
  const { hero, sections } = landing(lang)
  const route = sections.find((s) => s.id === "route")
  return (
    <div data-block="yk7bv" className="bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
      {hero && <HeroView hero={hero} route={route} />}
      {sections.filter((s) => s !== route).map((s) => <SectionView key={s.id} section={s} />)}
    </div>
  )
}

function SectionView({ section }: { section: Section }) {
  switch (section.id) {
    case "solves": return <Contrast section={section} />
    case "spaces": return <Spaces section={section} />
    case "files": return <Hood section={section} />
    case "talk": return <Agent section={section} />
    case "agent": return <Agent section={section} />
    case "turn-on": return <Steps section={section} />
    case "connect": return <Connect section={section} />
    case "hood": return <Hood section={section} />
    case "more": return <More section={section} />
    case "credits": return <Credits section={section} />
    default: return <Generic section={section} />
  }
}

function HeroView({ hero, route }: { hero: Hero; route?: Section }) {
  return (
    <section data-block="ge5xv" className="border-b border-border">
      <div data-block="va2yr" className={cn(WRAP, "grid items-center gap-12 py-16 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-16 md:py-24")}>
        <div data-block="iv49q" className="flex flex-col gap-6">
          <H1 data-block="qokjk" scale="hero" className="text-balance">{hero.title}</H1>
          <Lead data-block="b6mxr" className="max-w-[58ch] text-pretty">{inline(hero.description, "hero")}</Lead>
          <div data-block="ijnnq" className="flex flex-wrap items-center gap-3 pt-2">
            {hero.cta && <a href={hero.cta.href} className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base")}>{hero.cta.label}</a>}
            {hero.secondary && (
              <a href={hero.secondary.href} className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 px-5 text-base")}>{hero.secondary.label}</a>
            )}
          </div>
          {hero.pill && <Badge data-block="n6xef" variant="outline" className="w-fit">{hero.pill}</Badge>}
        </div>
        {route && <Route section={route} />}
      </div>
    </section>
  )
}

/** Путь поиска: станции — пары `text-h4` (имя) + `text-p` (что делает), примечание — `text-small`. */
function Route({ section }: { section: Section }) {
  const stations: { name: string; text: string }[] = []
  for (const b of section.blocks) {
    if (b.kind === "text-h4") stations.push({ name: b.text, text: "" })
    else if (b.kind === "text-p" && stations.length && !stations[stations.length - 1].text) stations[stations.length - 1].text = b.text
  }
  const back = first(section, "text-small")
  return (
    <figure data-block="nclwy" className="rounded-[calc(var(--radius)*2)] border border-border bg-card p-6 text-card-foreground shadow-[0_28px_64px_-32px_color-mix(in_oklab,var(--primary)_45%,transparent)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700 md:p-8">
      <figcaption data-block="w9zxf"><H2 data-block="r9k9l" variant="ui">{section.title}</H2></figcaption>
      <ol data-block="xdxur" className="mt-6 flex flex-col">
        {stations.map((s, i) => {
          const Icon = ROUTE_ICONS[i % ROUTE_ICONS.length]
          return (
            <li data-block="mt393" key={s.name} className="relative flex gap-4 pb-7 last:pb-0">
              {i < stations.length - 1 && <span aria-hidden className="absolute top-11 bottom-1 left-5 w-px -translate-x-1/2 bg-border" />}
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                <Icon className="size-5" aria-hidden />
              </span>
              <div data-block="ksd9g" className="min-w-0 pt-1">
                <H3 data-block="n2tk3" variant="ui">{s.name}</H3>
                <Small data-block="wdr3q" className="mt-1 text-pretty">{inline(s.text, `route-${i}`)}</Small>
              </div>
            </li>
          )
        })}
      </ol>
      {back && (
        <div data-block="zdfoy" className="mt-6 flex gap-3 rounded-[var(--radius)] border border-dashed border-primary/40 bg-primary/5 p-4">
          <CornerDownLeft className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <Small data-block="m2mpk" className="text-pretty">{inline(back.text, "route-back")}</Small>
        </div>
      )}
    </figure>
  )
}

/** «Без него / с ним»: таблица из двух колонок, слева боль, справа ответ. */
function Contrast({ section }: { section: Section }) {
  const table = first(section, "text-table")
  return (
    <section data-block="mef9m" id={section.id} className={cn(WRAP, "scroll-mt-20 py-16 md:py-24")}>
      <H2 data-block="gq80p" className="max-w-[24ch] text-balance">{section.title}</H2>
      {table && (
        <div data-block="xn4mp" className="mt-10 overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border">
          <Table data-block="wue2o">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-1/2 px-5 whitespace-normal text-muted-foreground">{table.head[0]}</TableHead>
                <TableHead className="w-1/2 px-5 whitespace-normal text-primary">{table.head[1]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="px-5 py-4 align-top whitespace-normal text-muted-foreground">
                    <span className="flex gap-3"><X className="mt-1 size-4 shrink-0" aria-hidden /><span>{inline(r[0] ?? "", `solves-${i}-a`)}</span></span>
                  </TableCell>
                  <TableCell className="px-5 py-4 align-top whitespace-normal font-medium text-foreground">
                    <span className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden /><span>{inline(r[1] ?? "", `solves-${i}-b`)}</span></span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}

function Code({ text }: { text: string }) {
  return (
    <pre className="max-w-full self-start overflow-x-auto rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-5 font-mono text-[length:var(--fs-small)] leading-6 text-card-foreground shadow-sm">
      <code>{text}</code>
    </pre>
  )
}

/** Слова и список (раздел «как говорить с памятью»); код справа — только если он есть в данных раздела. */
function Agent({ section }: { section: Section }) {
  const code = first(section, "text-code")
  const list = first(section, "text-list")
  return (
    <section data-block="w9fn9" id={section.id} className="scroll-mt-20 border-y border-border bg-muted/40">
      <div data-block="f93wz" className={cn(WRAP, "grid gap-10 py-16 md:grid-cols-2 md:gap-16 md:py-24")}>
        <div data-block="v8da9" className="flex min-w-0 flex-col gap-5">
          <H2 data-block="ovyi7" className="text-balance">{section.title}</H2>
          {all(section, "text-p").map((p, i) => <P data-block="vyiua" key={i} className="text-pretty">{inline(p.text, `agent-${i}`)}</P>)}
          {list && (
            <ul data-block="jmb91" className="mt-2 flex flex-col divide-y divide-border border-y border-border">
              {list.items.map((t, i) => <li data-block="nacui" key={i} className="py-3 text-pretty text-foreground">{inline(t, `agent-skill-${i}`)}</li>)}
            </ul>
          )}
        </div>
        {code && <div data-block="sb8aa" className="min-w-0"><Code text={code.text} /></div>}
      </div>
    </section>
  )
}

/** Начало: шаги по порядку — здесь номер несёт смысл, последовательность важна. */
function Steps({ section }: { section: Section }) {
  const list = first(section, "text-list")
  const note = first(section, "text-small")
  return (
    <section data-block="nrdoq" id={section.id} className={cn(WRAP, "scroll-mt-20 py-16 md:py-24")}>
      <H2 data-block="fhkcm" className="text-balance">{section.title}</H2>
      {list && (
        <ol data-block="irwvd" className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {list.items.map((t, i) => (
            <li data-block="f13e6" key={i} className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/40 font-semibold tabular-nums text-primary">{i + 1}</span>
              <P data-block="njrra" className="pt-1 text-pretty text-foreground">{inline(t, `step-${i}`)}</P>
            </li>
          ))}
        </ol>
      )}
      {note && <Small data-block="cvdcd" className="mt-8 max-w-[70ch] text-pretty">{inline(note.text, "steps-note")}</Small>}
    </section>
  )
}

/** Подключение элемента: слова, настоящий вызов двери памяти (из README элемента), что дальше. */
function Connect({ section }: { section: Section }) {
  const [lead, ...rest] = all(section, "text-p")
  const code = first(section, "text-code")
  return (
    <section data-block="xtr6z" id={section.id} className="scroll-mt-20 border-y border-border bg-muted/40">
      <div data-block="uheev" className={cn(WRAP, "py-16 md:py-24")}>
        <H2 data-block="b1kpg" className="text-balance">{section.title}</H2>
        {lead && <P data-block="orqpu" className="mt-5 max-w-[68ch] text-pretty">{inline(lead.text, "connect-lead")}</P>}
        {code && <div data-block="lrj3o" className="mt-8 min-w-0"><Code text={code.text} /></div>}
        {rest.map((p, i) => <P data-block="igw7x" key={i} className="mt-6 max-w-[68ch] text-pretty">{inline(p.text, `connect-${i}`)}</P>)}
      </div>
    </section>
  )
}

/** Две колонки «имя — что делает»: под капотом и виды файлов. */
function Hood({ section }: { section: Section }) {
  const table = first(section, "text-table")
  const COLS = "md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]"
  return (
    <section data-block="q0hjl" id={section.id} className={cn(WRAP, "scroll-mt-20 py-16 md:py-24")}>
      <H2 data-block="y2pb7" className="text-balance">{section.title}</H2>
      {table && (
        <div data-block="sgtxg" className="mt-10 border-y border-border">
          <div data-block="dxsm2" className={cn("hidden gap-8 border-b border-border py-3 md:grid", COLS)}>
            <Small data-block="a0ah0" className="font-medium">{table.head[0]}</Small>
            <Small data-block="op0iv" className="font-medium">{table.head[1]}</Small>
          </div>
          <dl data-block="k5t4v" className="divide-y divide-border">
            {table.rows.map((r, i) => (
              <div data-block="i74zj" key={i} className={cn("grid gap-1 py-4 md:gap-8", COLS)}>
                <dt data-block="vobua" className="font-medium text-foreground">{inline(r[0] ?? "", `hood-${i}-a`)}</dt>
                <dd data-block="gqq3m" className="text-pretty text-muted-foreground">{inline(r[1] ?? "", `hood-${i}-b`)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}

function More({ section }: { section: Section }) {
  const p = first(section, "text-p")
  return (
    <section data-block="ja58m" id={section.id} className="scroll-mt-20 border-t border-border">
      <div data-block="smzce" className={cn(WRAP, "grid gap-6 py-16 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-8 md:py-20")}>
        <H2 data-block="zoq83" className="text-balance">{section.title}</H2>
        {p && <Lead data-block="j1r84" className="max-w-[60ch] text-pretty">{inline(p.text, "more")}</Lead>}
      </div>
    </section>
  )
}

function Credits({ section }: { section: Section }) {
  const p = first(section, "text-p")
  return (
    <section data-block="bvmmh" id={section.id} className="border-t border-border bg-muted/40">
      <div data-block="dytqp" className={cn(WRAP, "flex flex-col gap-2 py-10")}>
        <H2 data-block="fbro9" variant="ui">{section.title}</H2>
        {p && <Small data-block="in06x" className="max-w-[80ch] text-pretty [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4">{inline(p.text, "credits")}</Small>}
      </div>
    </section>
  )
}

/** Чья это память (узел, шаг 650-4): схема «кто что видит» — блок каталога `block-access-map` (заголовок раздела — его заголовок), под
 * ней слова раздела. Владелец 2026-11-05: «схематически изобразите как память администратора доступно семь а внутри элементы доступны
 * только свою пространство». */
function Spaces({ section }: { section: Section }) {
  const map = first(section, "block-access-map")
  return (
    <section data-block="xp4yj" id={section.id} className={cn(WRAP, "scroll-mt-20 py-16 md:py-24")}>
      {map ? (
        <AccessMap blockKey={section.id} title={section.title} outer={map.outer} spaces={map.spaces} between={map.between} />
      ) : (
        <H2 data-block="sdlcn" className="text-balance">{section.title}</H2>
      )}
      {all(section, "text-p").map((p, i) => <P data-block="jjg0l" key={i} className="mt-5 max-w-[68ch] text-pretty">{inline(p.text, `spaces-${i}`)}</P>)}
    </section>
  )
}

/** Раздел с незнакомым `id` — общим видом типографики элемента. */
function Generic({ section }: { section: Section }) {
  return (
    <section data-block="aebxc" id={section.id} className={cn(WRAP, "scroll-mt-20 py-16 md:py-24")}>
      <H2 data-block="blo59" className="text-balance">{section.title}</H2>
      <div data-block="hqlo8" className="mt-6 flex max-w-[70ch] flex-col gap-4">
        {section.blocks.map((b, i) => {
          const Render = TEXT_SET[b.kind]
          return Render ? <Render key={i} blockKey={`${section.id}-${i}`} {...b} /> : null
        })}
      </div>
    </section>
  )
}
