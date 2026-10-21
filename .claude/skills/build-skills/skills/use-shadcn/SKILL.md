---
name: use-shadcn
description: >
  Builder skill. The gatekeeper of the vendored `shadcn` skill in this Fractera element: every widget, tool and block is built
  only from shadcn components (`components/ui`) — nothing hand-made — and where our law is louder than the shadcn skill.
  Load it before writing any button, input, select, textarea, table, tabs, dialog, toast, form or card; before adding a shadcn
  component; whenever the person asks for "a form", "a table", "a modal", "a notification", "a toggle", "make it look like …";
  and the moment the shadcn skill tells you to compose a Dialog or pick a toast. The thing you cannot guess: a raw `<button>` or
  `<table>` looks fine and builds fine, but it leaves the node's design system — it does not re-skin with the design tokens,
  does not keep keyboard and screen-reader behaviour, and gets no highlight address; `check-shadcn-rules` refuses it.
---

<!-- PROOF · PARTIAL 2026-10-07: the law kept in four tasks (shadcn only, refusal of a raw button); the skill itself never loaded · report: development-docs/proofs/2026-10-07-page-skills.md -->

# use-shadcn

> Informational, not binding: know a better way for the case in front of you — do it your way and say so. The one thing that

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).
> is not optional: no hand-made control in a widget, a tool or a block.

The vendored `shadcn` skill (`.claude/skills/shadcn/`, provenance in its `SOURCE.md`) owns **how** its components compose — use
it for that. This skill owns **what is allowed** in this element.

## The law

Widgets (`<branch>/_widgets/`), tools (`_tools/`), blocks (`components/blocks/`) and every component they import are built
from `components/ui` and the typography primitives. A control the folder does not have is added, never written by hand:

```
npx shadcn@latest add <component>        # lands in components/ui/
```

Check the folder first: a kind of thing that already has an owner keeps it — a second implementation is a fork of the look.

🛑 **After every `add`, read what it wrote.** CLI 4.21 wrote `import { cn } from "cn"` into new files and installed an
unrelated npm package `cn` (measured 2026-10-07): the types still pass. The import must be `@/lib/utils`; remove the package.
A new component that fails a guard (contrast, typography) is fixed or not kept — never exempted.

## Where our law is louder than the shadcn skill

| It says | Here | Why |
|---|---|---|
| compose `Dialog` + `DialogContent` yourself | **`AppDialog` only** (`components/dialog/app-dialog.client.tsx`) | one window for the whole element: height limit, scrolling body, the same close; `check:dialogs` refuses a direct import |
| pick a toast for the base | **`sonner` only**, its `Toaster` is mounted once in `app/[lang]/layout.tsx` | a second toast system means two toasters and doubled messages |
| semantic colours (`bg-primary`) | **the token is the only colour** | the person repaints every element from «Design»; a literal colour silently leaves that system |
| switch the base or migrate Radix → Base UI | **the owner's decision** | this element carries both; a migration is a rewrite nobody ordered |

Everywhere else follow it as written: `cn()`, `gap-*` over `space-*`, `size-*`, `Field` / `FieldGroup` for forms, `Empty`,
`Skeleton`, `Separator`, icons via `data-icon`.

## What our `Button` is

Base UI underneath, not Radix: **there is no `asChild`.** A link that looks like a button is a link with the button's
look — `<Link className={buttonVariants({ variant: "outline" })} href=…>` — never a `Button` wrapped around a link and never
`onClick={() => location.href = …}` (it would not open in a new tab, not copy, not exist for a screen reader).
`variant="bare"` / `size="bare"` — an own look over shadcn behaviour (next section).

## An own look is still shadcn

A landing or a widget with its own world (a design skill such as `impeccable`) keeps its look **through** the components:
`variant`, `size` and `className` on design tokens. Its buttons are `Button`, its fields are `Input` — never a raw tag.

## Every container has an address

A shadcn container (`Card`, `Field`, `Accordion`, `Table`, `Tabs` …) gets `data-block` like any `div`: run
`npm run widgets:ids`. The components pass it to the DOM, so the highlight finds it — skill `use-highlight`.

## How you know it worked

`npm run prebuild` passes: `check-shadcn-rules` (no raw control, the shadcn style rules), `check:dialogs`, `check:widget-ids`.
Never hand-edit anything under `.claude/skills/shadcn/` — `npx skills update` overwrites it.
