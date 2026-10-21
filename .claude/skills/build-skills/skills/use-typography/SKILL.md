---
name: use-typography
description: >
  Builder skill. How plain text is written on a page of this Fractera element — as `text-*` items of the page's sequence,
  drawn by the element's own typography, not as blocks and not as hand-styled markup. Load it whenever you write or change
  words on a page: a paragraph, a heading, a list, a quote, a code sample, a table, an article, documentation, a legal page, "add a
  section of text", "make this a list", "the heading is too small" — and before reaching for a block or a class to style text.
  The thing you cannot guess: a text item has no look of its own; size, colour and font come from the node's design tokens
  through `components/ui/typography`, so the same page re-skins itself when the design changes and stays readable with no
  JavaScript. A hand-styled `<h2 className=…>` breaks both and the typography guard refuses the build.
  Russian phrasings of the person: «текст», «абзац», «заголовок», «список», «таблица», «цитата», «код на странице».
---

<!-- PROOF · PROVEN 2026-10-07 and again 2026-10-12 with text-table (after the port to roman) · reports: development-docs/proofs/2026-10-07-page-skills.md, 2026-10-12-six-skills.md (in roman) -->

# use-typography

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## When text is `text-*` and when it is a block

| You need | Write |
|---|---|
| words to read: a heading, a paragraph, a list, a quote, a code sample | `text-*` |
| a designed section: a first screen, cards, an FAQ, a warning card | a block (`block-*`, skill `use-page-tree`) |
| a heading of a section with an anchor and a badge | `block-section-head` |

Plain text is not a block on purpose: a block is a section with its own spacing and width; text is the content between them.

## The kinds — `lib/content/text-set.tsx`

```json
{ "kind": "text-h2", "text": "Planting", "id": "planting" }
{ "kind": "text-h3", "text": "In spring" }
{ "kind": "text-h4", "text": "Soil" }
{ "kind": "text-p", "text": "Water **once**, right after planting. [Why](/en/why)" }
{ "kind": "text-lead", "text": "The short version first." }
{ "kind": "text-small", "text": "Measured on our own beds in 2026." }
{ "kind": "text-list", "items": ["Dig", "Plant", "Water"], "ordered": true }
{ "kind": "text-quote", "text": "Less water, more roots.", "cite": "A gardener" }
{ "kind": "text-code", "text": "npm run pages:refresh" }
{ "kind": "text-table", "head": ["Term", "Meaning"], "rows": [["Node", "Your own computer"]], "align": [null, null] }
```

- Inside a line: `**bold**`, `*italic*`, code in backticks and `[link](address)`; an address starting with `/` is a soft `Link`
  (skill soft-navigation), an external one opens in a new tab. Nothing else — no raw HTML.
- `text-table` (node step 458-4): head and rows of strings, each cell takes the same inline marks; the table scrolls sideways
  inside its frame on a phone.
- `id` on a heading makes an anchor: `/<lang>/<page>#planting`.
- **There is no `text-h1`.** The page's `title` is its only H1, drawn by the page itself; a second H1 hurts search.
- Each item gets a `bid` like every element of the sequence: `npm run blocks:ids` stamps it; you answer with its link
  `#block=<bid>` — skill `use-highlight`.

## Every language, the same sequence

A translation file repeats the sequence with its own words: the same kinds in the same order, the same `bid`.
`check:page-sequence` refuses a translation that drops, adds or moves an item. A language without its file shows English.

## A kind that is missing

Need a kind the set does not have (a table of text, a definition list)? Add one line to `lib/content/text-set.tsx` built on
`components/ui/typography`, its type in `lib/content/blocks/types.ts`, and its Markdown line in `lib/aio/blocks-to-markdown.ts`
— otherwise the page's text twin for agents silently loses it. Never add styles that the typography primitives do not have.

## How you know it worked

The page shows the text, `/<lang>/<page>/index.md` carries the same words, and `npm run prebuild` passes
(`check:page-sequence`, `check:typography`).
