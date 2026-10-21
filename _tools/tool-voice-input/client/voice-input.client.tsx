"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useVoiceRecorder, VOICE_BAR, type VoiceTargetRef, type AllVoiceStrings } from "./use-voice-recorder";

// ГОЛОСОВОЙ ВВОД — маленькая кнопка рядом с полем (перенос v1, шаг 232).
//
// 🔒 С ШАГА 32-2 ЗДЕСЬ ТОЛЬКО ОБЛИК. Механика — разрешение микрофона, запись,
// столбики уровня, таймер, расшифровка, память курсора — живёт в
// `use-voice-recorder.ts`, одна на все интерфейсы. Владелец заказал второй облик
// того же умения (контейнер, где микрофон встроен в поле), и две копии работы с
// `AudioContext` разошлись бы молча: обе продолжали бы работать, но по-разному
// слышать тишину и по-разному объяснять отказ.
//
// 🔒 ПОВЕДЕНИЕ ЭТОЙ КНОПКИ НЕ ИЗМЕНИЛОСЬ НИ НА ШАГ. Она стоит в форме настроек
// слоя архитектора и в карточке товара; 32-2 — перекладка внутренностей, а не
// правка интерфейса. Всё, что меняется для человека, меняется в 32-3.
//
// 425 (владелец 2026-10-07): облик собран из shadcn (`Button`, `Textarea`) и токенов — в элементе ничего самописного; прежнее
// «без shadcn, чтобы работать распакованным где угодно» отменено. Отказ по-прежнему СТРОКОЙ ПОД КНОПКОЙ, а не тостом.
//
// КАК СЕБЯ ВЕДЁТ (дизайн владельца, как в v1):
//   • УДЕРЖИВАЕШЬ кнопку — идёт запись; отпустил — уходит на расшифровку.
//   • Во время записи полоса 40px показывает приходящий звук; в центре — время.
//   • ПОМНИТ КУРСОР: расшифровка встаёт туда, где он стоял, а не в конец поля.

function MicIcon({ off }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-3.5">
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
      {off ? <path d="M3 3l18 18" /> : null}
    </svg>
  );
}

export default function VoiceInput({
  targetRef,
  value,
  onChange,
  lang,
  disabled,
  apiUrl,
  strings,
}: {
  /** Поле, которое принимает речь (его курсор решает КУДА). */
  targetRef: VoiceTargetRef;
  value: string;
  /** Зовётся с полным новым текстом; курсор остаётся сразу после вставленных слов. */
  onChange: (next: string) => void;
  lang: string;
  disabled?: boolean;
  /** Адрес двери расшифровки; не задан — `/api/tools/tool-voice-input`. */
  apiUrl?: string;
  /** Слова облика на языке страницы — выбирает сервер (`voiceStrings(lang)`), клиент словарь не импортирует (422). */
  strings: AllVoiceStrings;
}) {
  const v = useVoiceRecorder({ targetRef, value, onChange, lang, disabled, apiUrl, strings });
  const L = v.strings;

  return (
    <div data-block="hxxuk" className="flex w-full flex-col gap-1.5">
      <div data-block="gkuy2" className="flex w-full items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || v.busy || !v.supported}
          title={v.supported ? L.tipOk : L.tipInsecure}
          onPointerDown={(e) => { e.preventDefault(); v.start(); }}
          onPointerUp={v.stop}
          onPointerLeave={v.stop}
          onPointerCancel={v.stop}
          className={cn(v.recording && "border-recording/50 text-recording")}
        >
          <MicIcon off={!v.supported} />
          {v.busy ? L.transcribing : v.recording ? L.recording : L.hold}
        </Button>

        {/* ПОЛОСА ЗВУКА — 40px; столбики 2px через 1px, до 32px, дописываются слева
            направо; в центре плашка с прошедшим временем. */}
        {v.recording ? (
          <div data-block="td3tf"
            ref={(el) => {
              if (el) v.setBarCapacity(Math.floor(el.clientWidth / (VOICE_BAR.width + VOICE_BAR.gap)));
            }}
            className="relative h-10 min-w-[120px] flex-1 overflow-hidden rounded-md border border-border bg-muted/40"
          >
            <div data-block="hctbf" className="absolute inset-0 flex items-center" style={{ gap: `${VOICE_BAR.gap}px`, paddingInline: 2 }}>
              {v.bars.map((h, i) => (
                <span key={i} className="shrink-0 rounded-sm bg-primary/70" style={{ width: `${VOICE_BAR.width}px`, height: `${h}px` }} />
              ))}
            </div>
            <span className="absolute left-1/2 top-1/2 flex h-5 -translate-x-1/2 -translate-y-1/2 items-center rounded bg-background px-2 text-[11px] font-medium tabular-nums text-foreground shadow-sm">
              {v.elapsed}
            </span>
          </div>
        ) : null}
      </div>

      {/* РАСШИФРОВКА ЖДЁТ РЕШЕНИЯ — под кнопкой, до вставки. Показать сказанное и
          спросить дороже на одно нажатие, но дешевле любой ошибки распознавания:
          текст встаёт в СЕРЕДИНУ документа, и выловить там чужую фразу тяжелее,
          чем один раз её прочитать. */}
      {v.draft !== null ? (
        <div data-block="m7q38" className="w-full rounded-md border border-border bg-muted/30 p-2">
          <p data-block="w89qf" className="mb-1 text-[10px] font-medium text-muted-foreground">{L.draftTitle}</p>
          {/* Текст ПРАВИТСЯ прямо здесь: одно неверно услышанное слово не должно
              стоить повторной диктовки всего абзаца. */}
          <Textarea
            value={v.draft}
            onChange={(e) => v.setDraft(e.target.value)}
            rows={Math.min(8, Math.max(2, v.draft.split("\n").length + 1))}
            className="text-xs leading-relaxed"
          />
          <div data-block="e986o" className="mt-1.5 flex items-center gap-2">
            <Button type="button" size="sm" onClick={v.accept} disabled={!v.draft.trim()}>
              {L.accept}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={v.discard}>
              {L.discard}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Причина отказа — строкой рядом с кнопкой: тостов у инструмента нет, а
          тупика быть не должно. */}
      {!v.supported ? <p data-block="t6l8l" className="text-xs text-muted-foreground">{L.tipInsecure}</p> : null}
      {v.note ? <p data-block="ek293" className="text-xs text-warning">{v.note}</p> : null}
    </div>
  );
}
