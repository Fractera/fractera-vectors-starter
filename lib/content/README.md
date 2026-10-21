# lib/content — how a page is drawn from its data

| File | Role |
|---|---|
| `blocks/registry.tsx` | the set of blocks + `renderBlocks`: one pass over the sequence — `block-*`, `text-*`, the branch's `widget-*` |
| `blocks/types.ts` | every kind a sequence may hold |
| `text-set.tsx` | the element's typography: `text-h2`…`h4`, `p`, `lead`, `small`, `list`, `quote`, `code` (skill `use-typography`) |
| `create-content-page.tsx` | the page factory: metadata, frame, body; takes the branch's widgets |
| `resolve.ts` · `page-ui.ts` · `post-body-ui.ts` | words of the frame and language overrides |

The page text twin for agents is `lib/aio/blocks-to-markdown.ts`: a new kind needs its line there too. Pages and branches —
`lib/page-tree.ts`, `lib/branch-page.tsx` (skill `use-page-tree`).
