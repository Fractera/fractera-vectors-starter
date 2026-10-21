export type Tone = 'data' | 'reach' | 'access' | 'code' | 'muted'

export const TONE_CLASS: Record<Tone, string> = {
  data: 'bg-tone-data/15 text-tone-data',
  reach: 'bg-tone-reach/15 text-tone-reach',
  access: 'bg-tone-access/15 text-tone-access',
  code: 'bg-tone-code/15 text-tone-code',
  muted: 'bg-muted text-muted-foreground',
}

/** Классы ярлыка целиком: форма и размер общие, цвет — от смысловой группы. */
export function badgeClass(tone: Tone): string {
  return `rounded-full px-3 py-1 text-[length:var(--fs-eyebrow)] font-medium ${TONE_CLASS[tone]}`
}
