'use client'

// РЕДАКТОР РАЗДЕЛА APP-CONFIG (шаг 299-5): группы basics · seo · metaMedia редактора aifa.dev/ru/architect/app-config.
// Движок перенесён как есть (`config-editor`, `field-row`, описание полей `lib/settings/fields.ts`, подписи
// `fields.i18n.ts`); разница одна — значения приходят не из файла на сервере страницы, а из двери элемента
// (`/<lang>/admin/api/settings/app`), и туда же уходит заплата. Страница остаётся статической оболочкой.
//
// Начальные значения считаются так же, как на aifa.dev: языковое поле на языке по умолчанию — само поле, на другом
// языке — перевод `i18n[путь][язык]`, а при его отсутствии показывается основное значение (так его видит посетитель).
import { useEffect, useMemo, useState } from 'react'
import { atPath, sectionsOfGroup } from '@/lib/site-settings/fields'
import { resolveSocialLinks } from '@/lib/site-settings/socials'
import { ConfigEditor } from './config-editor.client'
import type { FieldsUi } from './fields.i18n'
import { loadSettings, type Access, type AccessWords } from './settings-access'
import { AccessNotice } from './access-notice'
import { Button } from '@/components/ui/button'

export type SettingsEditorProps = {
  group: string
  lang: string
  langs: string[]
  defaultLang: string
  editLangLabel: string
  ui: FieldsUi
  words: AccessWords
  loginHref?: string
}

const asText = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : v === undefined || v === null ? '' : JSON.stringify(v)

export function SettingsEditorIsland({ group, lang, langs, defaultLang, editLangLabel, ui, words, loginHref }: SettingsEditorProps) {
  const [access, setAccess] = useState<Access>('loading')
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)
  const [editLang, setEditLang] = useState(defaultLang)
  const sections = useMemo(() => sectionsOfGroup(group), [group])
  // 308-1: вид настроек — у секций группы (оформление правится тем же редактором).
  const kind = sections[0]?.kind ?? 'app'

  useEffect(() => {
    loadSettings(kind).then((r) => {
      setAccess(r.access)
      setConfig(r.config)
    })
  }, [kind])

  const prepared = useMemo(() => {
    if (!config) return null
    const i18n = (config.i18n ?? {}) as Record<string, Record<string, string>>
    const values: Record<string, string> = {}
    const translatedPaths: string[] = []
    for (const field of sections.flatMap((s) => s.fields)) {
      const isTranslation = field.perLang && editLang !== defaultLang
      const translation = isTranslation ? i18n[field.path]?.[editLang] : undefined
      if (isTranslation && typeof translation === 'string' && translation.trim() !== '') translatedPaths.push(field.path)
      if (field.type === 'icons') {
        values[field.path] = asText((config.iconSet as { id?: string } | undefined)?.id)
        continue
      }
      // Список соцсетей едет строкой JSON и читается тем же резолвером, что и на aifa.dev (`resolveSocialLinks`).
      if (field.type === 'socials') {
        values[field.path] = JSON.stringify(resolveSocialLinks(config.seo as Parameters<typeof resolveSocialLinks>[0]))
        continue
      }
      values[field.path] = translation ?? asText(atPath(config, field.path))
    }
    return { values, translatedPaths }
  }, [config, sections, editLang, defaultLang])

  if (access !== 'ok' || !prepared) return <AccessNotice access={access} words={words} loginHref={loginHref} />

  return (
    <div data-block="liau1" className="flex flex-col gap-6">
      <div data-block="iekbp" className="flex flex-wrap items-center gap-2" role="group" aria-label={editLangLabel}>
        <span className="text-sm text-muted-foreground">{editLangLabel}</span>
        {langs.map((l) => (
          <Button
            key={l}
            type="button"
            size="sm"
            variant={l === editLang ? 'default' : 'outline'}
            aria-pressed={l === editLang}
            onClick={() => setEditLang(l)}
          >
            {l.toUpperCase()}
          </Button>
        ))}
      </div>
      {/* key: смена языка правки — новый редактор со своими исходными значениями (так же на aifa.dev: язык — в адресе). */}
      <ConfigEditor
        key={editLang}
        kind={kind}
        sections={sections}
        initial={prepared.values}
        lang={lang}
        editLang={editLang}
        defaultLang={defaultLang}
        translatedPaths={prepared.translatedPaths}
        ui={ui}
      />
    </div>
  )
}
