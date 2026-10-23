---
name: use-page-tree
description: >
  Builder skill. How a page is added to this Fractera element — as a FOLDER OF DATA under a branch, read by the one child route of
  that branch, never as a new `page.tsx`. Load it before creating anything under `app/`, whenever the person asks for
  "a new page", "a section", "an article", "a page for the role X", "the same page in Russian", when a text on a page
  must be corrected, and whenever a build is slow and you are about to look for the cause. The thing you cannot guess:
  Next compiles every route file on its own, so a site that grows one `page.tsx` per page builds slower with every page —
  measured on this node as 1252 s for 300 page files against 98 s for the same 300 pages through one template. The
  build succeeds either way; nothing warns you until the person waits an hour.
---

<!-- PROOF · PARTIAL 2026-10-07: the tab is now named «Live site» and «Open in a new tab» is named — that wording is not re-proven; the line about the Markdown copy (step 428) NOT proven; proven before it: loaded first for a docs page; data only, same sequence and bid in en/ru, #block= links · report: development-docs/proofs/2026-10-07-page-skills.md -->

# use-page-tree

> Informational, not binding: know a better way for the case in front of you — do it your way and say so. The one thing

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).
> that is not optional: a new page never arrives as a new route file.

> The whole file tree of the element, the starting tree it must keep and how to restore a deleted page or branch live in the
> skill `use-element-tree` (sections «Tree» and «Restore the starting architecture»; guard `npm run check:tree`, node step 462).

## The rule

**A page is a folder of data. A branch has code only at its root.** Each branch is `layout.tsx` + `page.tsx` (its root)
and one `[slug]/page.tsx` (all its children; `[...slug]` in the protected branches). A child lives in `<branch>/_pages/<slug>/`;
in a protected branch a folder named after a role holds that role's pages one level deeper: `_pages/<role>/<page>/`. `scripts/check-routes.mjs`
runs first in `npm run build` and fails on any route file outside its closed list.

## Why — measured, not believed (node step 298, Next 16.2)

| built | total |
|---|---|
| a site of 40 pages | 103 s |
| + 100 pages as separate `page.tsx` | 183 s |
| + 300 pages as separate `page.tsx` | **1252 s** |
| + the same 300 pages through one template | **98 s** |

A production build is always the whole app; the only lever is how many route files the app has.

## Where things are

| What | Where |
|---|---|
| branches | `app/[lang]/(publicLayer)` · `(protectedLayer)/{account,staff,finance,admin}` · `(guestLayer)/guest` |
| reading the tree | `lib/page-tree.ts` — `branchRoot`, `branchChild`, `branchChildren`, `wordsIn` |
| building a root and a child | `lib/branch-page.tsx` — `rootPage`, `childRoute` |
| working widgets of a page | `<branch>/_widgets/static|dynamic/widget-…/`, listed in `<branch>/_widgets/index.tsx` |
| kinds a page may use | `block-*` — the set in `lib/content/blocks/registry.tsx`; `text-*` — `lib/content/text-set.tsx`; `widget-*` — the branch's `_widgets/index.tsx`; all typed in `lib/content/blocks/types.ts` |
| the guard | `scripts/check-routes.mjs` |

## Adding a page — files of data, no code

```
<branch>/_pages/<slug>/meta.json   { "order": 30, "roles": ["buyer"] }
<branch>/_pages/<slug>/en.json     { "title": "…", "description": "…", "keywords": "", "blocks": [ { "kind": "text-p", "text": "…" } ] }
<branch>/_pages/<slug>/ru.json     { "title": "…", "description": "…", "blocks": [ … ] }
```

- The address is the branch plus the folder: `/<lang>/account/<slug>`; for the public branch `/<lang>/<slug>`. A page of a role
  folder: `/<lang>/account/<role>/<page>` (two levels at most).
- `en.json` is required; every other language overrides it. A language without its file shows English.
- In a protected branch the lock of a page is the role of its folder with every role that inherits it (`lib/roles.ts` →
  `ROLE_PARENTS`), plus `roles` from `meta.json`, plus the architect. A page several roles need goes into the folder of the
  parent role — never a copy per role. `{roles}` inside a paragraph prints the same list the lock uses.
- There is no list of pages anywhere: the folder is the page — in the sitemap and in the map for agents it appears by
  itself. Delete the folder and it is gone everywhere.

## What a page is made of — one sequence

`blocks` in `<lang>.json` is one sequence of three kinds, in any order:

| Kind | Example | How |
|---|---|---|
| `block-<name>` — a designed section | `{ "kind": "block-hero-centered", "title": "…", "description": "…" }` | below |
| `text-<name>` — plain text | `{ "kind": "text-p", "text": "…" }` | skill `use-typography` |
| `widget-static-<name>` / `widget-dynamic-<name>` — this branch's own work | `{ "kind": "widget-dynamic-users-table" }` | skill `build-widget` |

- Every language repeats the same sequence with its own words (same kinds, same order, same `bid`); `check:page-sequence`
  refuses anything else, an unknown kind and any `tool-*` — tools live only inside widgets (skill `use-tools`).
- A page of one widget: the sequence holds only it; `meta.json` → `"bare": true` drops the page frame.
- **Which `block-*` a page may name** = the keys of `BLOCK_SET` in `lib/content/blocks/registry.tsx` — read them before you
  propose a block. A component in `components/blocks/` is not enough (✗ node step 464: an agent offered `block-cta-button`, which
  lives only inside the hero and is not in the set — the guard would refuse the page).
- **A block** the set does not have — skill `use-blocks`: by the node's mode it comes from the Blocks element (`npm run blocks --
  find`, then `add`, or a request) or is built here among the element's own blocks; either way it is registered in
  `lib/content/blocks/registry.tsx`, `lib/content/blocks/types.ts` and `lib/aio/blocks-to-markdown.ts`. Never draw a section by hand.
- A public page has a Markdown copy for agents (`<page>/index.md`, `llms-full.txt`) built from this sequence; a `widget-*`
  in it brings its own text through `markdown.ts` (skill `use-machine-copy`).

## Drawn on the first visit, fresh every five minutes

The build draws only the roots of the branches. A child's `generateStaticParams` returns `[]`: it is drawn on its first
visit, kept on disk, and refreshed by the next visit after five minutes (`revalidate = 300`, classic mode — do not switch
to Cache Components on your own). Texts are read at run time from the element folder (`ELEMENT_DIR`), so a corrected
paragraph appears within those five minutes without a rebuild; code changes need a rebuild.

**After every text change run `npm run pages:refresh`** (`scripts/refresh-pages.mjs` → `POST /api/revalidate` on this
machine, key in the header, never in the address): the next visit shows the change at once. Tell the person: "the change
is live, reload the page" — or, if the command failed, "it will appear within five minutes".

🛑 **On the own domain visitors may still see the old page.** Public pages that are in the Cloudflare copy of the site
(skill `cloudflare-connection`) are served from that copy, made at the last «Accept»/«Deploy» or «Update copies» on the core's
«Domain activation»; `pages:refresh` changes this computer only. Compare `curl` of `127.0.0.1:<port>` with the public address;
tell the person: the change is on the computer, visitors see it after «Deploy» or «Update copies». ✗ 2026-10-07: the menu
changed at 127.0.0.1, roman.throughsongs.com kept the old one.

🛑 **Except when the page needs new code** (a new widget, a new block): the data on disk reaches the live site by itself within
five minutes, the code only after «Deploy» — in between the live page loses that part. Say it in the plan, do not run
`pages:refresh`, and ask the person to deploy right after. ✗ 2026-10-07: «My orders» showed a bare title to every visitor.

## Correcting a page someone talks about

People name pages by their words. Search `app/**/_pages/**/<lang>.json` for those words; the matching folder is the
page. Fix the paragraph in that language, then check the other languages for the same mistake.

## Every block has an address — and you answer with its link

The whole law, both directions and every kind of container — skill `use-highlight`. For pages:

Every block in `<lang>.json` carries a `bid` (a letter and four base36 characters, the same in every language). The person
may bring an address copied on the tab «Live site» of this element in the core («Click to update» → the core's task window):

```
Page: /ru/privacy
File: app/[lang]/(publicLayer)/_pages/privacy/ru.json
Block: kns6w (p)
Link: /ru/privacy#block=kns6w
```

Open that file, find that `bid`, edit that block and nothing else.

**When you finish editing a block, end your answer with the block's link** and one sentence for the person: "Open this element's tab «Live site» («Живой сайт») in the core, paste the link into its field and press «Find» («Найти») — the page scrolls there and frames it for 3 seconds. «Open in a new tab» shows the page without the frame: the site does not read `#block=` by itself."

- The link is `/<lang>/<path>#block=<bid>`. Take the `Link` line of the address you were given. If you found the block
  yourself, build it: public root `/<lang>`, public page `/<lang>/<slug>`, protected branch `/<lang>/<branch>` and its
  page `/<lang>/<branch>/<slug>`, guest `/<lang>/guest/<slug>`; the `bid` is in the JSON.
- `<lang>` is the language file you edited. Edited several blocks — one link per block.
- No host and no port: the node's port changes and the tab «Live site» adds its own element's address.
- A new block has no `bid` yet: run `npm run blocks:ids` first, then give its link.

## The real exception

A new branch (a new root) is new code and a decision of the person: ask first, then add its files to `ALLOWED` in
`scripts/check-routes.mjs` with the reason. A behaviour that more than one page needs becomes a widget or a block kind,
and the pages stay data.

## Proof this rule is guarded

Add `app/[lang]/(publicLayer)/x/page.tsx` → `npm run build` stops with `===ROUTES_FAILED===`; remove it →
`===ROUTES_OK===`.
