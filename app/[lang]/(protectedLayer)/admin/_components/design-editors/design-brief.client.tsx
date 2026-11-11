'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { H2, P, Small } from '@/components/ui/typography'
import type { BriefWords } from './design-brief.i18n'

// БРИФ ДИЗАЙНА (шаг 706-4): форма над частью `design` паспорта через дверь `/<язык>/admin/api/settings/brief`. Скриншот референса
// уходит в своё хранилище элемента (`/api/media/upload`, поле `file`); в брифе остаётся его `media`.
type Ref = { url?: string; media?: string; note?: string }
type Pinned = { prototype: string; skill: string; at: string }
type Brief = { skill?: string; audience?: string; character?: string[]; avoid?: string; references?: Ref[]; inheritedFrom?: string; pinned?: Pinned }
// 711 (владелец 2026-11-09: «а не те которые ты щас хард кодом вытащишь»): списка навыков в коде нет — навык выбирают из живого поиска и
// закрепляют во вкладке ядра «Строительство → Дизайн»; здесь он только показан.

export function DesignBrief({ lang, words }: { lang: string; words: BriefWords }) {
  const door = `/${lang}/admin/api/settings/brief`
  const [brief, setBrief] = useState<Brief | null>(null)
  const [character, setCharacter] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | string>('idle')
  const [uploading, setUploading] = useState<number | null>(null)
  useEffect(() => {
    fetch(door, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { brief?: Brief } | null) => { const b = j?.brief ?? {}; setBrief(b); setCharacter((b.character ?? []).join(', ')) })
      .catch(() => setBrief({}))
  }, [door])
  if (!brief) return <div data-block="wm1mm" className="h-40" data-design-brief="loading" />
  const set = (patch: Partial<Brief>) => { setBrief({ ...brief, ...patch }); setState('idle') }
  const refs = brief.references ?? []
  const setRef = (i: number, patch: Partial<Ref>) => set({ references: refs.map((r, k) => (k === i ? { ...r, ...patch } : r)) })
  async function upload(i: number, file: File) {
    setUploading(i)
    const fd = new FormData()
    fd.append('file', file)
    const j = await fetch('/api/media/upload', { method: 'POST', body: fd }).then((r) => r.json()).catch(() => null) as { ok?: boolean; item?: { id: string } } | null
    setUploading(null)
    if (j?.ok && j.item) setRef(i, { media: j.item.id })
    else setState(`${words.failed} upload`)
  }
  async function save() {
    setState('saving')
    if (!brief) return
    const body = { ...brief, character: character.split(',').map((w) => w.trim()).filter(Boolean).slice(0, 5), }
    const r = await fetch(door, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null)
    const j = r ? await r.json().catch(() => null) as { ok?: boolean; reason?: string; brief?: Brief } | null : null
    if (j?.ok && j.brief) { setBrief(j.brief); setCharacter((j.brief.character ?? []).join(', ')); setState('saved') }
    else setState(`${words.failed} ${j?.reason ?? 'network'}`)
  }
  return (
    <section data-design-brief data-block="design-brief" className="my-6 flex max-w-3xl flex-col gap-5 rounded-lg border border-border p-5">
      <div data-block="design-brief-head" className="flex flex-col gap-1">
        <H2 data-block="rfvus">{words.title}</H2>
        <P data-block="aygxe" className="text-muted-foreground">{words.lead}</P>
        {brief.inheritedFrom ? <Small data-block="fkzrd" data-brief-inherited>{words.inherited} {brief.inheritedFrom}</Small> : null}
      </div>
      <Field data-block="ab23g">
        <FieldLabel htmlFor="brief-audience">{words.audience}</FieldLabel>
        <Textarea id="brief-audience" value={brief.audience ?? ''} onChange={(e) => set({ audience: e.target.value })} rows={3} />
        <FieldDescription>{words.audienceHint}</FieldDescription>
      </Field>
      <Field data-block="ydcn4">
        <FieldLabel htmlFor="brief-character">{words.character}</FieldLabel>
        <Input id="brief-character" value={character} onChange={(e) => { setCharacter(e.target.value); setState('idle') }} />
        <FieldDescription>{words.characterHint}</FieldDescription>
      </Field>
      <div data-block="design-brief-references" className="flex flex-col gap-3">
        <FieldLabel>{words.references}</FieldLabel>
        <FieldDescription>{words.referencesHint}</FieldDescription>
        {refs.map((r, i) => (
          <div key={i} data-block="design-brief-reference" className="flex flex-col gap-2 rounded-md border border-border p-3">
            <Input aria-label={words.link} placeholder={words.link} value={r.url ?? ''} onChange={(e) => setRef(i, { url: e.target.value })} />
            <Input aria-label={words.note} placeholder={words.note} value={r.note ?? ''} onChange={(e) => setRef(i, { note: e.target.value })} />
            <div data-block="q3iaj" className="flex flex-wrap items-center gap-3">
              {r.media ? <img src={`/api/media/${r.media}/file`} alt={r.note ?? ''} className="h-16 w-auto rounded border border-border" /> : null}
              <Label className="cursor-pointer text-sm font-medium text-primary underline underline-offset-4">
                {uploading === i ? words.uploading : words.upload}
                <Input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(i, f) }} />
              </Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => set({ references: refs.filter((_, k) => k !== i) })}>{words.remove}</Button>
            </div>
          </div>
        ))}
        {refs.length < 12 ? <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => set({ references: [...refs, {}] })}>{words.addReference}</Button> : null}
      </div>
      <Field data-block="w90c5">
        <FieldLabel htmlFor="brief-avoid">{words.avoid}</FieldLabel>
        <Textarea id="brief-avoid" value={brief.avoid ?? ''} onChange={(e) => set({ avoid: e.target.value })} rows={2} />
        <FieldDescription>{words.avoidHint}</FieldDescription>
      </Field>
      <Field data-block="gebpf">
        <FieldLabel>{words.skill}</FieldLabel>
        <P data-block="bsk7p" data-brief-skill={brief.skill ?? ''}>{brief.skill ? (brief.pinned ? `${brief.skill} · ${words.pinnedFrom} ${brief.pinned.prototype}` : brief.skill) : words.noSkill}</P>
        <FieldDescription>{words.skillHint}</FieldDescription>
      </Field>
      <div data-block="hznzt" className="flex items-center gap-3">
        <Button type="button" onClick={() => void save()} disabled={state === 'saving'} data-brief-save>{state === 'saving' ? words.saving : words.save}</Button>
        {state === 'saved' ? <Small data-block="yffhc" data-brief-state="saved">{words.saved}</Small> : state !== 'idle' && state !== 'saving' ? <Small data-block="c6wzq" className="text-destructive" data-brief-state="failed">{state}</Small> : null}
      </div>
    </section>
  )
}
