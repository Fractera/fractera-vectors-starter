import type { Shape } from './index'

// The words of this section in the page's Markdown twin (717-2: its case of the old switch of the twin, moved here).
export function markdown(section: Shape): string[] {
  return [`## ${section.title}`, ...(section.note ? ['', section.note] : []), '', `**${section.outer.title}** — ${section.outer.text}`, '', ...section.spaces.map((s) => `- **${s.title}** — ${s.text}`), ...(section.between ? ['', section.between] : [])]
}
