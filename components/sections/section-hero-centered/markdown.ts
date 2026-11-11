import type { Shape } from './index'

// The words of this section in the page's Markdown twin (717-2: its case of the old switch of the twin, moved here).
export function markdown(section: Shape): string[] {
  return [
    ...(section.pill ? [`_${section.pill}_`, ''] : []),
    `# ${section.title}`,
    '',
    section.description,
    ...(section.cta ? ['', `[${section.cta.label}](${section.cta.href})`] : []),
    ...(section.secondary ? [`[${section.secondary.label}](${section.secondary.href})`] : []),
  ]
}
