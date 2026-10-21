---
name: deploy-element
description: >
  Builder skill. How a change of this Fractera element reaches visitors — what needs a build and what does not, the two ways to
  look at the site (the tab «Live site» of the live version and the Preview before deploy), when to advise each, and what you may
  and may not do on the «Preview & Deploy» page. Load it whenever you finish a change and are about to tell the person how to
  see it; whenever the person says "deploy", "publish", "it does not show", "I want to see it first", "roll back", "preview";
  and before you are tempted to run a build or a script of the core yourself. The thing you cannot guess: a code change is
  invisible on the live site until a build, a text change is visible without one — and a build is the person's decision with a
  cost in minutes and memory on their computer.
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# deploy-element

> Informational, not binding: know a better way for the case in front of you — do it your way and say so. Not optional: the live

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).
> site is changed only by the person's button.

## What needs a build

| Change | Visible on the live site |
|---|---|
| page data — texts, order of a sequence (`<lang>.json`, `meta.json`) | without a build on this computer: `npm run pages:refresh`, or by itself within 5 minutes; on the own domain the Cloudflare copy keeps the old page until «Deploy» or «Update copies» |
| code — a widget, a component, a tool, a block, styles, a door | only after a build: «Deploy», or «Preview» → «Accept» |

A page that names a widget not built yet: the running site skips that item (a server log line) until the build — tell the person.

## Three ways to see the site

| | Where | Shows | For |
|---|---|---|---|
| **Tab «Live site»** («Живой сайт») of this element in the core | `/<lang>/<element>/preview` | the **live** version, with «Highlight», the link field and «Find», tasks to you; «Open in a new tab» → the development preview or the live site, without the frame | always: look, point at a block |
| **Preview before deploy** | button «Preview» on «Preview & Deploy» → `http://127.0.0.1:<spare port>/<lang>` | the **new** version, built next to the live one, before visitors see it | doubt or risk (below) |
| **Live site** | the element's address | what visitors see | after «Accept» or «Deploy» |

**Preview before deploy is a full production build** (minutes) plus a second server of this element (~120 MB) kept until the
person decides. It is not a development mode: a code change made after it needs a new build. It answers only on this computer.
Its window has no highlight — to point at a block, use the tab «Live site» after «Accept».

## What to advise the person

- **«Preview» first** when they may not want the result: a new look or design, a new widget, a change to something that already
  works, or they say they are unsure. «Reject» leaves the live site untouched, and the reason they give comes back to you as a task.
- **«Deploy» directly** for a small change they are sure of: the old version keeps serving until the build ends, and a way back
  stays on the same page.
- **Nothing** on this computer for a data change: `npm run pages:refresh` and «reload the page». Visitors of the own domain see it
  after «Deploy» or «Update copies» on the core's «Domain activation».
- Do not leave a preview hanging: until «Accept» or «Reject» it holds memory and blocks the next deploy.

## What you do — and do not

- **You:** commit, with `TASK-REPORT.json` at the element root in the same commit — it is built into that version and «Open
  preview» shows it next to the block:
  ```json
  { "task": "what was asked", "done": ["what changed"], "check": ["how to check it"], "path": "/ru/docs", "anchor": "k3f9a" }
  ```
  Then send the person to «Preview & Deploy» of this element with one sentence of advice from above.
- **You build a preview only when the person asks** («build the preview»), with the core's door or script — one build at a time.
- **Never «Accept» or «Deploy» yourself** — the live site is the person's decision (owner 2026-10-07).
- One build at a time: «another deployment is running» or «a preview waits for a decision» means wait, not retry.
- A core rebuild stops a running element build — if the person asks to rebuild the core, say so.

## How you know it worked

After the person's «Accept»: the live address shows the change; for a block, the link `#block=<bid>` pasted into the field of the tab «Live site» and «Find» frames it.
