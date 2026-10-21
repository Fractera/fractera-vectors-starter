# `/<lang>/finance` — `_widgets/`: the branch's widgets

Required folder of every route branch (owner 2026-10-07). The underscore keeps it out of routing.

## What lives here

Blocks of the **finance** branch's pages that the catalog of blocks does not have: a list of orders, a role's dashboard, a
form with its own logic. A page is one sequence of `block-*`, `text-*` and `widget-*` (`.claude/modes/build.md`, «Page»); a widget stands in it by its name
from this branch's `_widgets/index.tsx`. Built from shadcn primitives and typography; a tool when it needs that capability;
a block only as a whole section, unchanged.

- **Layout:** `_widgets/static/<name>/` — rendered on the server, part of the prerendered page;
  `_widgets/dynamic/<name>/` — a browser island over a static twin, for what must change without a reload.
- **Every container has an address** `data-block="<letter + 4 base36>"` — the highlight in the node's Preview and «click to
  update» see only `[data-block]`. `npm run widgets:ids` stamps every container of every widget under `_widgets/static|dynamic/`.
- **Words through i18n:** a widget's strings live in its `*.i18n.ts` (`en` and `ru` at least), never inline.
- **Not here:** a block another branch also needs — make it a catalog block; a piece that is not a whole block —
  `../_components/`.

## Naming

Every widget is named by what it is (owner 2026-10-07): its folder and its entry file start with `widget-static-` or
`widget-dynamic-`, matching the folder it lives in.

- `_widgets/static/widget-static-<name>/` — e.g. `widget-static-price-list/`
- `_widgets/dynamic/widget-dynamic-<name>/` — e.g. `widget-dynamic-users-table/`

The same name is the widget's name in the branch's widget list and in `meta.json` → `"widget"`. Why: a search, an import or a
highlighted block tells what the thing is — and that it belongs to this route — without opening the file. The same family across
the project: tools `tool-<name>`, blocks `block-<name>`.

How to make one, its door and its skeleton — skill `build-widget`.

## Rule of thumb

A widget is a whole block a person can point at on the page and say «change this one».
