---
name: custom-design
description: Builder skill. Use when the person asks for a custom design of a page or the whole element instead of the Blocks element (for example "make it look amazing", "drop the blocks", "own design", "landing page with its own style"). Asks which of the two vendored design skills to use (taste or impeccable), loads it, and states which rules of this element win over the skill.
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# Custom design — the gatekeeper of two design skills

> A skill is a hint, not a law: it says WHEN and which rules win; the chosen design skill says HOW.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## When

The element designs itself through the Blocks and Design elements by default. When the person refuses that design and asks for
their own look (owner's decision 2026-09-28, node step 330-5), **ask once, before any code**:

> «Which design skill should I use? **taste** (Leon Lin — anti-generic product landing: asymmetric layouts, one accent, strict
> pre-flight checklist) or **impeccable** (Paul Bakaus — a design direction derived from your audience's world, one committed
> visual world, a craft floor)?»

After the answer, load that skill (`design-taste-frontend` or `impeccable`) and design in its style, following it fully.
**With impeccable, read `impeccable-on-design.md` next to this file before building:** it marries the skill to the Design
element (roles as relations to `--primary` in OKLCH, a measured formula per world), so every preset gets its own palette.
Then write its name into the passport `OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json` → `designSkill` and run `npm run describe:publish` (node step 333-3).

## Where the design lives

A page with its own look is a **widget** that takes the whole page: its data folder's `meta.json` names
`"bare": true` and its sequence holds only the widget `widget-static-<name>`; the widget lives in `<branch>/_widgets/static/widget-static-<name>/` and is listed in that branch's `_widgets/index.tsx`.
Words stay in the page data (`_data` / `_pages/<slug>/<lang>.json`), never in code. Example: `app/[lang]/(publicLayer)/_widgets/static/widget-static-reference-title/`
(the home page).

## What this element's rules override in both skills

- **Pages stay static.** Server component by default; motion only in CSS or in a small `"use client"` island; never
  `force-dynamic`, `cookies()` or `headers()` in a page. Run `npm run check:static`.
- **Words are data, two languages at least** (`en` required, `ru`). No visible string in code.
- **No sub-agents, no hooks.** impeccable's agent steps take its `reference/degraded/*.md` path; its hooks are not installed.
- **impeccable's launcher downloads a binary** (`scripts/impeccable`). Run it only with the person's yes in this conversation;
  otherwise follow the skill's «Launcher unavailable» path.
- **Claims stay true.** A public page does not state what does not exist without the person's explicit yes.
- **Colours, fonts and corners are Design tokens** (node step 333-2): map every role of the skill world to `--primary`,
  `--accent`, `--destructive`, `--background`, `--muted`, `--foreground`, `--border`, `--font-heading`, `--font-body`,
  `--radius` - never a hex value or a font name in the widget, so the Design element restyles the page.
- **Fonts are local.** Add an `@fontsource*` package and import it in the widget; no Google Fonts link.
- **Guards.** `check:typography` requires the shared scale: add the widget file to its named exceptions with the reason
  (the person asked for an own look). Run `check:routes check:content check:seo check:static check:typography`.
- **Highlight addresses after every generation** (node step 335): written or rewritten a widget → `npm run widgets:ids`. It
  puts `data-block="<id>"` on every container (`section`, `div`, `h1`–`h6`, `p`, `li`…) that has none, keeps the existing ones;
  the build fails on a container without one. Never write or change these ids by hand.
- **taste's icon rule** (no lucide) yields to this project: lucide-react is already the project's library.
