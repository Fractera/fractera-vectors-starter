---
name: use-highlight
description: >
  Builder skill. How everything this Fractera element draws stays findable by the highlight of the tab «Live site» of this element in the core — in both
  directions: the person points at any container and gets its address to give you a precise task, and you finish a change by
  returning the link `#block=<bid>` that scrolls the tab «Live site» to the place and frames it. Load it whenever you create or change
  a block, a text item, a widget, a tool or any component a widget uses; whenever the person pastes an address
  (`Page: … File: … Block: …`) or asks "where is this", "change this block", "show me what you changed"; and before you end an
  answer about a page. The thing you cannot guess: the highlight sees only `[data-block]`; a container without it is invisible
  to the person, so their task arrives vague and your answer cannot point anywhere — and nothing breaks visibly.
---

<!-- PROOF · PARTIAL 2026-10-07: the tab is now named «Live site» and «Open in a new tab» is named — that wording is not re-proven; proven before it: loaded for the Preview address question; links #block= ended tasks a and e · report: development-docs/proofs/2026-10-07-page-skills.md -->

# use-highlight

> Informational, not binding: know a better way for the case in front of you — do it your way and say so. The one thing that

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).
> is not optional: every container you draw has an address.

## The two directions

- **Direct** — the person turns on «Highlight» on the tab «Live site» of this element in the core (`/<lang>/<element address>/preview`), points at a container and copies its address:
  ```
  Page: /ru/privacy
  File: app/[lang]/(publicLayer)/_pages/privacy/ru.json
  Block: kns6w (text-p)
  Link: /ru/privacy#block=kns6w
  ```
  Open that file, find that address, change that place and nothing else.
- **Reverse** — when you finish, end your answer with the link of each place you changed, `/<lang>/<path>#block=<bid>`, and
  one sentence: "Open this element's tab «Live site» («Живой сайт») in the core, paste the link into its field and press «Find» («Найти») — the page scrolls there and frames it for 3 seconds. «Open in a new tab» shows the page without the frame: the site does not read `#block=` by itself."
  No host and no port: the node's port changes. One link per changed place.

## Who puts the address

| What | Address | How |
|---|---|---|
| an item of a page's sequence (`block-*`, `text-*`, `widget-*`) | `bid` in `<lang>.json`, the same in every language | `npm run blocks:ids`; the page factory draws it as `data-block` |
| a page and its data file | `data-page`, `data-file` | the branch page (`lib/branch-page.tsx`) — nothing to do |
| a container in code: widgets, tools (`_tools/`), every `components/` file they import | `data-block="<letter + 4 base36>"` on each container | `npm run widgets:ids` — stamps the ones without |
| shadcn containers (`Card`, `Field`, `Accordion`, `Table`, typography `H2`/`P` …) | the same `data-block` | the same command; they pass it to the DOM |

- Libraries — `components/ui`, `components/ai-elements`, `components/dialog` — get no addresses inside: the caller puts the
  address on the component it uses.
- An address is the address of a **place in the code**: an element inside `.map()` carries one address for all its repeats.
- **A new widget or form:** after `npm run widgets:ids` read the stamped `data-block` of its outer container from the file
  and give that link — and the page item's `bid`. Never «find it by its title»: ✗ 2026-10-07 an answer ended without a link.
- Never change or reuse an address that exists: the person may already have copied it.
- A new container component (your own wrapper around shadcn): it must pass `...props` to its DOM root, and its name goes into
  `CONTAINERS` of `scripts/stamp-widget-ids.mjs` — otherwise the stamp does not see it.

## Finding an address

`git grep 'data-block="k3f9a"'` or `"bid": "k3f9a"` across `app/`, `components/`, `_tools/`.

## How you know it worked

`npm run prebuild` passes: `check-block-ids` (every item of every sequence has a `bid`) and `check:widget-ids` (every
container of every widget, tool and their components has a `data-block`). A container without an address fails the build.
