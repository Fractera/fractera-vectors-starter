# reference-title — the home page of the reference starter template

Node step 542 (owner, 2026-10-19): the home page of `fractera-custom-item-starter` has one line in the centre of the screen, «Reference
starter template», and nothing else. The yellow starter sign above it lives in `app/[lang]/layout.tsx`.

- **Words** — the `title` of the home page data `(publicLayer)/_data/<lang>.json`; `words.ts` reads it, no text in code.
- **Page** — `(publicLayer)/_data/<lang>.json` names `widget-static-reference-title` as the only block; `meta.json` keeps `bare: true`
  (only widgets are drawn).
- **Markdown copy** — `markdown.ts`, the same line as a heading.
- Listed in `(publicLayer)/_widgets/index.tsx` and `_widgets/markdown.ts`.
