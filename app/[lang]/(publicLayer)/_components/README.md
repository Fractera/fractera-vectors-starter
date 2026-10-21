# `/<lang>` — `_components/`: the branch's own components

Required folder of every route branch (owner 2026-10-07). The underscore keeps it out of routing: Next never turns it into a URL.

## What lives here

React components that belong to the **public** branch only — the pieces its `page.tsx`, `layout.tsx` and
`[slug]/page.tsx` are made of: the branch's page body, its shell parts,
the lock screen of the branch. `page.tsx` stays thin and re-exports from here.

- **Server by default.** A file is a server component unless it needs the browser; a browser piece is named `*.client.tsx`
  and stays an island inside a server component, so the page is still prerendered and readable without JavaScript.
- **Not here:** something two branches use — it goes to `components/` at the root (shadcn primitives in `components/ui/`);
  a block shown on a page — that is a widget (`../_widgets/`) or a catalog block; logic without markup — `../_libs/`.

## Rule of thumb

Delete the branch folder and nothing else in the element breaks: then the component was in the right place.
