---
name: use-blocks
description: >
  Builder skill. How the pages of this element get their sections: from blocks — designed, reusable sections that live in the element
  and are named by page data — never from a section drawn by hand. Load it before you add, change or rebuild any section of a page, a
  home page or a landing; when the person asks for "a hero", "a comparison", "three numbers", "steps", "pricing", "questions", "the same
  section as on …", "a new block"; when a page needs a section the element does not have; before you write any JSX that would draw a
  section of a page; and when the person asks where the blocks of this element are or what the page /admin/blocks shows. What you cannot
  guess: a block is code and enters the element ONCE, with a build; after that every page names it in data and changes without a build —
  so finding and reusing a block saves both the person's build and your tokens, and the node's mode (one owner or app factory) decides
  where the block comes from.
---

# use-blocks

> Informational, not binding: know a better way for the case in front of you — do it your way and say so. Two things are not optional:
> a section of a page is a block (or a request for one), never a section drawn by hand; and a block you change for this element gets its
> own name, never edits a copy taken from the catalogue.

**Process: build** — a new block is code: commit and a build of the element; confirm with the three lines of `.claude/modes/build.md`
(«Confirm the request first»). Composing a page from blocks that are already here is page data — see «What needs a build».

## Why blocks

A page of this element is a sequence of kinds in its data file (`_pages/<page>/<lang>.json`, skill `use-page-tree`): `block-*`, `text-*`
and `widget-*`. A block is designed once — on the «Design» tokens, with a highlight address on every container — and then any page names it
as many times as it needs with its own words. That is the whole economy: the design and the tokens are paid once per block, not once per
page. A section drawn by hand inside one page is paid again on the next page and drifts from the rest of the project.

## Where the blocks of this element are

| What | Where |
|---|---|
| the code of a block | `components/blocks/<block>.tsx` |
| its card (section, when to use it, cases with sample data) | `components/blocks/<block>.card.json` — comes with `add`; write one for your own block |
| the blocks a page may name | `BLOCK_SET` in `lib/content/blocks/registry.tsx` |
| the shape of its data | `lib/content/blocks/types.ts` (type `Block`) |
| its text in the copy of the page for agents | `lib/aio/blocks-to-markdown.ts` |
| what came from the catalogue, at which version | `components/blocks/.blocks-lock.json` (written by `add`) |
| the sections (hero, benefits, pricing …) | folders `app/[lang]/(protectedLayer)/admin/_pages/blocks/<section>/README.md` — all of them, empty ones too |

The architect sees all of it on `/<lang>/admin/blocks`: one table (block · Preview · section · description · origin · where it stands),
a page per section `/<lang>/admin/blocks/<section>`, and a Preview of one block `/<lang>/admin/blocks/<section>/<block>` — the crumbs and
that block, drawn with the words of the first page that uses it. The table reads the files above when the page is drawn, so a block you
register shows there at once — as «waits for a build» until the element is built. In the core this page opens from «Build → Blocks» of an
element whose link to the shared Blocks is off.

A block belongs to the section named first in `categories` of its card. A block without a card stands under «unsorted» — give it a card.

## The cycle — it depends on the node's mode

The mode is in `npm run passport -- me` → `node.type` (`project` or `factory`), read at every wake; follow one of the two ways.

### One owner (`project`) — the Blocks element is the shared store

1. **Find.** Say the need in plain English, the way a reader of the page would feel it:
   `npm run blocks -- find "three numbers that prove a claim"`. Five lines at most: the block, its closest case, where it may stand
   (standalone · standalone and inside X · only inside X), its role, installed here or not. A line marked «⚠ its card says avoid» is not
   for this need. Filters: `--role opener|body|closer`, `--category <section>`, `--collection <project>` (that project's set first).
2. **See.** `npm run blocks -- show <block>` — when to use it and when not, its limits («exactly 3», text length), the data shape and every
   case with sample data.
3. **Take it.** `npm run blocks -- add <block>` — writes the block, its card and its fingerprint, and registers it in the three places a
   kind lives. Run it again — nothing doubles. A copy changed by hand stops it: that is the point of the fingerprint.
4. **Adapt, if this element needs it different.** Copy the block under a name of its own — `block-<name>-<purpose>`, e.g.
   `block-hero-figure-shop` — with its own card, register the copy, and change the copy. The block taken from the catalogue stays as it
   came: a new version of it can still arrive with `add`, and the copy is never overwritten. Words and colours are not a reason to copy —
   words come from the page data, colours from «Design».
5. **Nothing fits.** `npm run blocks -- request "<the need>" --page <path> [--project <id>]`. You cannot write into the Blocks element —
   its folder is outside yours; the Blocks agent builds the block through its lifecycle (a published block, a variant, a new block, a new
   section by the owner's word). When it is published, go back to step 1. Until then build the page from what exists.

### App factory (`factory`) — the element keeps its own blocks

The shared Blocks element is not used: the apps of a factory belong to different owners, and a shared store would carry one owner's
design into another's app. The cycle is the same, inside this element:

1. **Look here first** — `/<lang>/admin/blocks` or `BLOCK_SET`: a block of this element that serves the need is reused as it is.
2. **Nothing here — build the block in this element:** `components/blocks/block-<name>.tsx` with its card (`categories` → the section),
   registered in `registry.tsx`, `types.ts` and `blocks-to-markdown.ts`; then `npm run widgets:ids` (every container gets its address).
   Build it for every page that may need it, not for this one page: the data shape carries the words, the component carries none.
3. **Reuse it** on any page of the element by naming it in the page data — no new code, no new tokens.

If `npm run blocks` does not exist in this element (`scripts/blocks.mjs` is missing), the element has not received the command yet: say so
to the person and use the factory way inside this element; never draw the section by hand.

## What needs a build, and what does not

- **A block enters the element** — taken with `add` or built here: it is code. Commit, then the element is built (beside the running
  version, switched in seconds). Once per block. Say it to the person in these words before you start.
- **A page made of blocks that are already here** — a new page, other words, another order, a block added to a page: page data. No build:
  the element draws a new page on its first visit and redraws a changed one within five minutes (or at once with `npm run pages:refresh`). This is why reuse matters — the second page costs no build.

## Rules of the catalogue

- The card decides the place: an opener first, a closer last, a block «only inside X» goes into the `children` of X, `repeat: once` once
  per page.
- A home page is a sequence of blocks; a page of one widget (`bare`) is not a way around this.
- Words of a block come from the page data; colours and type from «Design». Never edit a block's file to change its look for one page.
- Every container of a block carries `data-block` (blocks of the catalogue arrive with them; run `npm run widgets:ids` for your own).
- What you took, adapted or built is written in the step's report: block, the case you started from, why.
