# `/<lang>/staff` — `_libs/`: the branch's own logic

Required folder of every route branch (owner 2026-10-07). The underscore keeps it out of routing.

## What lives here

Code without markup that only the **staff** branch uses: reading and shaping its data, its types, its small helpers
(formatting a value for this branch, deciding which page of `_pages/` a role sees), server functions its components call.

- **Data goes through the doors, not around them:** rows through the element's data layer, settings through
  `DESIGN-CONFIG`/`APP-CONFIG` readers in `lib/` — a file here calls them, it does not read another element's files.
- **No secrets in client code:** anything imported by a `*.client.tsx` reaches the browser — keys and server-only reads
  stay in files that only server components import.
- **Not here:** logic two branches share — it goes to `lib/` at the root; markup — `../_components/` or `../_widgets/`.

## Rule of thumb

If a function would make sense in another branch tomorrow, it belongs in `lib/` today.
