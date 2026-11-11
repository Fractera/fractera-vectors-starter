---
name: use-design
description: >
  Builder skill. Where the look is decided — the brief and this element's own tokens in `DESIGN-CONFIG` (fonts, colours of both
  themes, type scale, corners, spacing, width). Load it when the person asks to change colours, a theme, a font, «make it darker»,
  «bigger text», «our brand colours», «where do I change the design», asks about /admin/design, and before writing any colour,
  font or radius into code.
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# use-design

> Informational, not binding: know a better way for the case in front of you — do it your way and say so. Two things are not optional:
> a colour, a font or a radius never goes into a widget or a section as a value (only as a token), and you never edit `DESIGN-CONFIG`
> by hand — the person changes the look on the page, the door writes the file.

**Process: build** — a new token or a new setting of the workshop is code: commit and a build of the element; confirm with the three
lines of `.claude/modes/build.md` («Confirm the request first»). Changing the value of an existing token is the person's action on the
page and needs no build — see «What needs a build».

## Why tokens

Every page of this element is drawn on the same tokens — `--primary`, `--accent`, `--destructive`, the neutrals, `--radius`, the
font roles and the type scale (`lib/design-css.ts` turns `DESIGN-CONFIG` into them when a page is drawn; pages stay static and are redrawn when the design changes). Change a token once and every
page, section and widget follows; a colour written into one widget is paid again on the next one and drifts from the rest. That is
why the workshop exists: the look is decided in one place, as data.

## Who owns the tokens

This element alone (node steps 706 and 716): no other element of the node writes them, and the only link an element has — to the
shared CONFIG — carries site settings, never the look. A sibling born «like X» (`create --look-like`) starts with X's
tokens and brief as its own copy.

**The same look as a sibling, later** (node step 717-5) — a family of elements whose working pages share one design. You never read
the sibling's folder and never ask its agent. The person asks the core's main agent; it puts the look the sibling took into the core
into your intake: a request `development-docs/pre-steps/<date>.md` and the data `<date>.look-from-<id>.json`. You apply it with
`npm run design:take -- development-docs/pre-steps/<date>.look-from-<id>.json`: the brief goes into the passport (`inheritedFrom`
names the sibling), each token branch the sibling has replaces yours, the rest stays. A copy, never a live link — the sibling changing
later changes nothing here. Then `npm run check:config-schemas`, `npm run eyes`, commit, the person approves. Your own sections stay
yours: the look is shared, the code is not.

## The brief

The first section of `/<lang>/admin/design`: who the site is for, its character in up to five words, references (a link and/or an
uploaded screenshot in this element's own store), what to avoid, the design skill (default `frontend-design`). It lives in the passport
(`OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json` → `design`, with `designSkill` in step), written by `PUT /<lang>/admin/api/settings/brief`
(architect or administrator). The design pass reads it first (`.claude/modes/build-design.md`); `npm run describe:publish` carries it to
the core.

## Where it lives

| What | Where |
|---|---|
| the tokens | `DESIGN-CONFIG/design-config.json` — only what the person decided; the rest falls back to the defaults in `config/design-config.defaults.ts` |
| the workshop pages | `app/[lang]/(protectedLayer)/admin/_pages/design/` — `/<lang>/admin/design` (fonts), `…/design/colors`, `…/design/type`, `…/design/shape`; one page per section, each a route |
| the editors | `app/[lang]/(protectedLayer)/admin/_components/design-editors/` — the editors of the four sections |
| the door | `GET/PATCH /<lang>/admin/api/settings/design` — the session of the architect or of this application's administrator (step 580); JSON merge patch, `null` returns a key to its default |
| the only writer of the file | `lib/architect/design-config-writer.ts` (the core's key door `app/api/settings/design` uses it too) |
| the brief | `lib/design-brief.ts` (shape: `lib/design-brief-shape.ts`, `npm run test:design-brief`), widget `widget-dynamic-design-brief` |
| the core's button | «Build → Design» of this element: a core page with the link the browser picks (this computer — the local port) |

## What to do with a request

- **«Change the colours / font / corners»** — give the person the link to the right page of the workshop
  (`/<lang>/admin/design/colors` and so on) and say what to pick there. Do not change the value yourself: the person sees the preview
  next to the controls and decides.
- **«Design my page» / a new look** — the design pass (`.claude/modes/build-design.md`): the brief first, then `DESIGN.md` and the tokens.
- **A look the tokens cannot express** (a gradient, a pattern, a second accent) — that is a new token or a new setting: the build
  process. Add the token to `config/design-config.schema.ts`, its default, `lib/design-css.ts`, and an editor field; then the widget
  uses the token. Never a value in the widget.
- **A custom design of a whole page** — the design pass with the skill the brief names; its colours and fonts still map to these
  tokens.
- **Text, not look** — skill `use-typography`; **settings of the site** (name, menu, footer, switches, languages) — the project's CONFIG, not this element.

## What needs a build, and what does not

- **A saved token or brief** — no build: the doors write `DESIGN-CONFIG` and the passport. Both are this element's own: commit them
  with your next build commit, so the repository keeps them.
- **A new token, a new editor field, a changed editor** — code: commit, build beside the running version, switch.
- **Fonts** are served by this element (`lib/design/local-fonts.json` → `scripts/local-fonts.mjs` → `public/fonts/`): a font family
  outside that table has no file — adding one is code.

## Rules

- Colours, fonts and radius in a section or a widget — only tokens (`bg-primary`, `text-muted-foreground`, `rounded-[var(--radius)]`).
- The workshop edits this element only; it sends nothing to the other elements of the node.
- Every container of the editors carries `data-block` (`npm run widgets:ids`).

Requests that bring this skill — the full list, moved from its description in 717-4: «rounder corners».
