# Collections — pages that list themselves

A **collection** is a folder of pages that knows its own contents. Drop a folder
in, and three surfaces update by themselves: the page's own route, its row in the
parent's index, and its entry in the menu. Nothing is maintained by hand, so
nothing can drift.

This is the shape to use for any group of pages in this project — the architect
layer, a documentation tab, a blog. Read this file before adding a page, adding a
level, or touching the generator.

## Add a page: one folder

```
<parent>/<slug>/
  page.tsx            thin: names its own folder, nothing else
  _data/
    meta.ts           slug + order (facts that never translate)
    en.ts             base language
    ru.ts             an override
    index.ts          ties the three together and exports `data`
```

That is the whole operation. Do **not** edit a menu, a dictionary, or a list of
routes — none of them exists any more.

```ts
// _data/meta.ts
import type { WorkspacePageMeta } from '@/lib/collection/types'
export const meta: WorkspacePageMeta = { slug: 'monitoring', order: 30 }

// _data/en.ts
import type { WorkspacePageWords } from '@/lib/collection/types'
export const en: WorkspacePageWords = { title: 'Server monitoring' }

// _data/index.ts
import type { WorkspacePageData } from '@/lib/collection/types'
import { meta } from './meta'
import { en } from './en'
import { ru } from './ru'
export const data: WorkspacePageData = { meta, en, overrides: { ru } }
```

## The rule the scanner follows

`lib/parser-fs.mjs` runs first in `prebuild` and `predev`. It walks the tree and
writes `_list.generated.ts` into **every folder whose children carry
`_data/index.ts`**.

That single positional rule is why **depth is not a parameter**. A blog (one
level) and a layer of groups with sections (two levels) are the same case, and a
third level would need no change to the generator. A group and a section are
built identically; only their position differs.

Each generated file exports two things:

- `PAGES` — this folder's children;
- `TREE` — each child paired with **its** children, so a menu of groups that
  unfold into sections is built from one import instead of one per group.

## Three things that will bite you

1. **Never edit `_list.generated.ts`.** The next build overwrites it without
   asking. It *is* committed to git (deliberately — the architecture must be
   readable on a fresh clone without building first), which makes it look like a
   source file. It is not.

2. **`order` is mandatory and explicit.** A blog orders posts by date; these
   pages have no date. Without `order`, the order would be the alphabet of folder
   names — and renaming a folder would silently reshuffle a menu.

3. **`meta.slug` must equal the folder name.** The generator does not correct it:
   a silent fix would hide a copy-paste mistake that surfaces later as a dead
   link. `npm run check:architect-routes` fails when they differ.

## What guards this

Both guards were **verified by breaking them**, not by their green colour:

- `check:architect-routes` — a page without `_data/index.ts` (an orphan: reachable
  by URL, absent from every menu), a `slug` that disagrees with its folder, a
  group missing from the root list, a list naming a folder that is gone.
- `check:i18n` — every page folder must carry `en.ts` and `ru.ts`, each with a
  non-empty `title`. Neither types nor the build see an empty title; the menu just
  grows an unlabelled row.

Note that `check:i18n` derives this list by walking the tree instead of holding
one. That is the point: a page arrives as a folder, so a hand-kept list would
never learn about it, and the guard would stay green over unchecked pages.

## Why this replaced the previous shape

A page used to live in three places: a hand-written array of routes, a key in a
central dictionary (type + `en` + `ru`), and the page file. Adding one page meant
four edits that had to agree, and forgetting one failed **silently** — half the
change visible, half not.

Structurally the same defect as everything else this project has paid for: two
halves of one fact, kept apart, drifting without a sound. A collection removes the
possibility rather than asking anyone to be careful.
