import type { ReactNode } from 'react'
import * as sectionHead from './section-head'
import * as sectionHeroCentered from './section-hero-centered'
import * as sectionWarningCard from './section-warning-card'
import * as sectionFaq from './section-faq'
import * as sectionAccessMap from './section-access-map'

// THE SECTIONS OF THIS ELEMENT (node step 717-2). A section is one folder named by its kind: its component and its fields in page
// data (`index.tsx`), its words in the Markdown twin (`markdown.ts`) and its README. A new section — its folder here and its line
// below; a folder without `markdown` does not compile, so the twin never loses a section's words.

export type SectionModule = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Section: (props: any) => ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  markdown: (section: any) => string[]
}

export const SECTIONS = {
  'section-head': sectionHead,
  'section-hero-centered': sectionHeroCentered,
  'section-warning-card': sectionWarningCard,
  'section-faq': sectionFaq,
  'section-access-map': sectionAccessMap,
} satisfies Record<`section-${string}`, SectionModule>

/** A section in a page's body: its kind and its fields. */
export type SectionItem = {
  [K in keyof typeof SECTIONS]: { kind: K } & Parameters<(typeof SECTIONS)[K]['markdown']>[0]
}[keyof typeof SECTIONS]

export const isSection = (kind: string): kind is keyof typeof SECTIONS => Object.prototype.hasOwnProperty.call(SECTIONS, kind)
