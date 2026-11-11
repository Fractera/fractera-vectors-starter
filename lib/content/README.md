# lib/content — how a page is drawn from its data

| File | Role |
|---|---|
| `page-items.ts` | every kind a page's `body` may hold — the sections (derived from `components/sections/index.ts`), `text-*`, `widget-*` |
| `inline.tsx` · `links.ts` · `tone.ts` | the markup inside a line, where a link leads, the tones of a badge |
| `text-set.tsx` | the element's typography: `text-h2`…`h4`, `p`, `lead`, `small`, `list`, `quote`, `code` (skill `use-typography`) |
| `create-content-page.tsx` | the page factory: metadata, frame, body; takes the branch's widgets |
| `resolve.ts` · `page-ui.ts` · `post-body-ui.ts` | words of the frame and language overrides |

The page's Markdown twin is `lib/aio/page-to-markdown.ts`: a section brings its own words (`markdown.ts` in its folder), a new `text-*`
kind needs its line there. The sections themselves — `components/sections/` (`renderPage` in its `page-body.tsx`). Pages and branches —
`lib/page-tree.ts`, `lib/branch-page.tsx` (skill `use-page-tree`).
