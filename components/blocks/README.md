# components/blocks — the blocks this element has installed

Designed sections of a page (`block-<name>`), copied from the Blocks element's registry and owned here. A page names them in
its sequence; `page-body.tsx` draws the sequence (skill `use-page-tree`).

| File | Kind |
|---|---|
| `block-hero-centered.tsx` (+ `block-cta-button.tsx`) | first screen |
| `block-section-head.tsx` | heading of a section with an anchor and a badge |
| `block-warning-card.tsx` | a warning card |
| `block-faq.tsx` | questions and answers (from the page's `faq`) |
| `page-body.tsx` | the factory: draws a sequence by its set; an unknown kind fails loudly |

Add one: `npx shadcn add @fractera/block-<name>`, a line in `lib/content/blocks/registry.tsx`, its type in
`lib/content/blocks/types.ts`, its Markdown line in `lib/aio/blocks-to-markdown.ts`. Plain text is not here — it is
`text-*` (`lib/content/text-set.tsx`, skill `use-typography`).
