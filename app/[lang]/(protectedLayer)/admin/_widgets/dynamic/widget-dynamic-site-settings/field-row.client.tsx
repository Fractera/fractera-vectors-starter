"use client"

import { Lock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Small } from "@/components/ui/typography"
import { Input } from "@/components/ui/input"
import { ColorField } from "./color-field.client"
import { ComboField } from "./combo-field.client"
import { SocialsField } from "./socials-field.client"
import type { Field } from "@/lib/site-settings/fields"
import type { FieldsUi } from "./fields.i18n"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

// ОДНА СТРОКА ФОРМЫ (31-4, 2026-08-28). Порт `field-row.client.tsx` панели —
// логика оттуда, размеры отсюда.
//
// 🔒 ШКАЛА ШРИФТА — СТРАНИЦЫ, А НЕ ПАНЕЛИ, и это прямое требование владельца
// 2026-08-28: «недостатком административной панели было то, что всё очень мелко;
// правильные высоты появились только в новой вкладке запуска — хочу такой же
// шрифт, в едином стиле со страницей». В исходнике подписи набраны `text-[10px]`
// и `text-[12px]`; здесь подпись — `--fs-small`, значение и поле ввода —
// `--fs-body` (16px). **Порт везёт логику, а не размеры.**
//
// 🔒 ГОЛОС — У ТОГО, ЧТО ПРОИЗНОСЯТ СЛОВАМИ, А НЕ У ВСЕГО ТЕКСТОВОГО (32-10).
// ✗ Здесь стояло «голос у каждого текстового поля», и это было ошибкой ровно того
// сорта, что легче всего не заметить: правило звучало стройно, а на экране микрофон
// получили подтверждение Яндекса, координаты, HEX-цвет и шаблон `%s | Бренд`.
// Владелец назвал это прямо: «подтверждение Яндекс? Реально.» Теперь решает признак
// `voice` в описании поля — оно одно знает, ЧТО в поле кладут, тогда как тип знает
// лишь, как поле устроено.
//
// 🔒 У ТОГО, ЧТО ГОЛОС ПОТЕРЯЛО, ПОЯВИЛОСЬ СВОЁ: почта, адрес и телефон получили
// клавиатуру браузера (`input`), четыре цвета — образец и палитру, валюта — четыре
// кнопки и открытый ввод, остальные — подсказку прямо в поле. Забрать и не дать
// взамен значило бы сделать форму беднее, а не честнее.
//
// 🔒 АДРЕС ДВЕРИ РАСШИФРОВКИ ЗАДАН ЯВНО. Инструмент по умолчанию стучится к
// соседу — относительно текущего пути, что дало бы
// `/{lang}/architect/app-config/api/transcribe`, двери, которой нет. Это записано
// в самом инструменте и стоило кому-то отладки; повторять не будем.
//
// 🔒 ЗАБЛОКИРОВАННОЕ ПОЛЕ ПОКАЗЫВАЕТСЯ, А НЕ ПРЯЧЕТСЯ. Человеку важно ВИДЕТЬ
// адрес своего сайта; спрятать поле значило бы заставить его искать значение,
// которое ему просто нельзя менять здесь. Рядом — замок и объяснение, где менять.
export function FieldRow({
  field,
  lang,
  value,
  translated,
  translationMode,
  onChange,
  ui,
}: {
  field: Field
  /** Язык страницы — для слов самого инструмента голоса. */
  lang: string
  value: string
  /** Есть ли перевод на выбранный язык настроек (только у языковых полей). */
  translated?: boolean
  /** Правится ли ДРУГОЙ язык, а не язык проекта по умолчанию. */
  translationMode: boolean
  onChange: (next: string) => void
  ui: FieldsUi
}) {
  const words = ui.fields[field.path] ?? { label: field.path }
  const id = `field-${field.path.replace(/\./g, "-")}`

  return (
    <div data-block="u9w88" data-field={field.path} data-field-type={field.type} className="flex flex-col gap-1.5">
      <div data-block="qjf18" className="flex flex-wrap items-center gap-2">
        <Label htmlFor={id} className="text-[length:var(--fs-small)] font-medium text-foreground">
          {words.label}
        </Label>

        {/* 🔒 НА ЯЗЫКЕ ПО УМОЛЧАНИЮ ПЕРЕВОДА НЕ СУЩЕСТВУЕТ — существует само
            значение. Здесь стояло «перевода нет» и на нём тоже: человек, правящий
            основной язык, читал это как незакрытый долг и шёл искать, где же
            перевести поле на его собственный язык. Поэтому в этом режиме поле лишь
            помечено языковым, а «есть/нет перевода» появляется только тогда, когда
            правится ДРУГОЙ язык. */}
        {field.perLang && (
          <Small
            data-per-lang
            data-translated={translationMode ? (translated ? "yes" : "no") : undefined}
            className={translationMode && translated ? "text-primary" : undefined}
          >
            {translationMode ? (translated ? ui.translated : ui.notTranslated) : ui.perLang}
          </Small>
        )}

        {field.locked && (
          <Small data-locked className="inline-flex items-center gap-1">
            <Lock className="size-3" aria-hidden />
            {ui.locked}
          </Small>
        )}
      </div>

      <div data-block="sdiot" className="flex items-start gap-2">
        {field.type === "textarea" || field.type === "text" || field.type === "number" ? (
          /* 🔒 ПОЛЕ, МИКРОФОН, ПОЛОСА И РАСШИФРОВКА — ОДИН ЭЛЕМЕНТ НА ТРИ МЕСТА
             (32-8). Здесь стояли Input/Textarea рядом с отдельной кнопкой голоса;
             связка была третьей копией того, что уже дважды одинаково в
             `VoiceField` и `VoiceTextarea`. Копии расходятся молча — эта успела
             отстать на весь новый облик. Различие двух раскладок принадлежит
             элементу и выражено его `variant`: у строки микрофон ВНУТРИ рамки, у
             области — снизу во всю ширину. */
          field.type === "textarea" ? (
            <Textarea
              id={id}
              rows={3}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={words.placeholder}
              disabled={field.locked}
              readOnly={field.locked}
              className="text-[length:var(--fs-body)]"
            />
          ) : (
            <Input
              id={id}
              type={field.type === "number" ? "number" : "text"}
              inputMode={field.input}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={words.placeholder}
              disabled={field.locked}
              readOnly={field.locked}
            />
          )
        ) : field.type === "color" ? (
          <ColorField id={id} value={value} placeholder={words.placeholder} disabled={field.locked} onChange={onChange} />
        ) : field.type === "combo" ? (
          <ComboField
            id={id}
            value={value}
            options={field.options ?? []}
            optionLabels={words.options}
            placeholder={words.placeholder}
            disabled={field.locked}
            onChange={onChange}
          />
        ) : field.type === "switch" ? (
          <Switch
            id={id}
            checked={value === "true"}
            disabled={field.locked}
            onCheckedChange={next => onChange(next ? "true" : "false")}
          />
        ) : field.type === "image" || field.type === "icons" ? (
          /* 299-5, первая часть: путь картинки и набор значков правятся текстом. Выборщик с кадрированием из
             aifa.dev (image-field, icons-field) переносится следующей частью — в выпуск без него шаг не идёт. */
          <Input id={id} value={value} onChange={e => onChange(e.target.value)} disabled={field.locked || field.type === "icons"} readOnly={field.locked || field.type === "icons"} />
        ) : field.type === "socials" ? (
          <SocialsField value={value} disabled={field.locked} onChange={onChange} ui={ui} lang={lang} />
        ) : field.type === "select" ? (
          <NativeSelect
            id={id}
            value={value}
            disabled={field.locked}
            onChange={e => onChange(e.target.value)}
            className="w-full text-[length:var(--fs-body)]"
          >
            {(field.options ?? []).map(option => (
              <NativeSelectOption key={option} value={option}>{words.options?.[option] ?? option}</NativeSelectOption>
            ))}
          </NativeSelect>
        ) : null}
      </div>

      {(words.hint || field.locked) && (
        <Small>{field.locked ? (words.hint ?? ui.lockedHint) : words.hint}</Small>
      )}
    </div>
  )
}
