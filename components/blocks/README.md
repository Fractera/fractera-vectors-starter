# components/blocks — the sections of this element

The element's own sections (`block-<name>`), its own code. A page names them in its sequence; `page-body.tsx` draws the sequence (skill `use-page-tree`).

| File | Kind |
|---|---|
| `block-hero-centered.tsx` (+ `block-cta-button.tsx`) | first screen |
| `block-section-head.tsx` | heading of a section with an anchor and a badge |
| `block-warning-card.tsx` | a warning card |
| `block-faq.tsx` | questions and answers (from the page's `faq`) |
| `page-body.tsx` | the factory: draws a sequence by its set; an unknown kind fails loudly |

Add one: the component here (words come from page data, every container carries `data-block`, colours are tokens, static), a line in `lib/content/blocks/registry.tsx`, its type in
`lib/content/blocks/types.ts`, its Markdown line in `lib/aio/blocks-to-markdown.ts`. Plain text is not here — it is
`text-*` (`lib/content/text-set.tsx`, skill `use-typography`).
