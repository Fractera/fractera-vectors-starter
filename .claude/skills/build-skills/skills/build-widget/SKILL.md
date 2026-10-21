---
name: build-widget
description: >
  Builder skill. How a widget is made in this Fractera element — a piece of a page with its own work (a table, a form, a
  wizard, a calculator, a landing drawn as one screen) that lives inside its route, is named in the page's sequence and talks
  to the server only through its own door inside the same branch. Load it whenever the person asks for something on a page
  that blocks and text cannot do: "a table of orders", "a form", "filter these", "a page that is fully custom", "make it
  interactive", "left buttons, right a table" — and before writing any React file under `app/`. The thing you cannot guess:
  a widget left outside its route (in `components/`, in a shared list) survives the deletion of the route as a tail, and an
  island that waits for the server with an empty box turns the static page into a broken one when the computer is off.
---

<!-- PROOF · PARTIAL 2026-10-07: the tab is now named «Live site» and «Open in a new tab» is named — that wording is not re-proven; the line «Its text for machines» (step 428) NOT proven; proven before it: loaded for a widget question and, after the fix, first for a widget task; #block= links · report: development-docs/proofs/2026-10-07-page-skills.md -->

# build-widget

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## Static or dynamic — decided by what it must do without a reload

| | `widget-static-<name>` | `widget-dynamic-<name>` |
|---|---|---|
| drawn | on the server, part of the static page | an island in the browser over a static twin |
| for | content that is known when the page is drawn | what changes without a reload: data, filters, input |
| folder | `<branch>/_widgets/static/widget-static-<name>/` | `<branch>/_widgets/dynamic/widget-dynamic-<name>/` |

Prefer static. A dynamic widget is for the case where nothing static can do the job (`.claude/modes/build.md`, «Page»).

## Where it lives and how a page shows it

1. Its folder in the branch that uses it (above). Its own components, logic and words stay inside that folder.
2. One line in the branch's list `<branch>/_widgets/index.tsx`:
   `'widget-dynamic-orders': (lang) => <Orders lang={lang} />`
3. The page names it in its sequence, in every language, at its place:
   `{ "kind": "widget-dynamic-orders" }` — then `npm run blocks:ids` gives it a `bid`.
4. A page that is only this widget: the sequence holds only it, and `meta.json` → `"bare": true` drops the page frame. The
   page's other words stay its text twin for search and agents.

**Order: code, then a rebuild, then it shows.** Page data is read live, widget code only from the build: the page names a new
widget before it is built — the running site skips it (a server log line), and it appears after «Preview» → «Accept» or «Deploy» (skill `deploy-element`). Tell the
person that, or deploy yourself if they ask. ✗ 2026-10-07: the page answered 500 here until the factory learned to skip.

**Its text for machines.** A widget on a public page also gets `markdown.ts` (`markdown(lang)` from the same words it renders) and
a line in `<branch>/_widgets/markdown.ts` — otherwise its words never reach the page's Markdown copy and `llms-full.txt`;
`npm run check:aio` fails without them. How — skill `use-machine-copy`.

A second route needs the same widget? Then it is no longer one route's — make it a block in the Blocks element, or a tool.

## What it is built from

- **shadcn primitives** (`components/ui`: `Button`, `Tabs`, `Table`, `Card`, `Dialog`…) and **typography**
  (`components/ui/typography`) — the material of every widget. No own styles: the look comes from the design tokens.
- **A tool** (`_tools/tool-<name>/`, skill `use-tools`) when the widget needs that capability: voice, image crop, a chat.
- **A block** only as a whole section dropped in unchanged (an FAQ under the table) — never as a part of the widget's own
  layout: a block carries a page section's width and spacing and fights the widget.
- **Words** in its own `*.i18n.ts` (`en` and `ru` at least). The server picks the language and passes the strings as props:
  a client file never imports a dictionary — it would ship every language to the browser (`check:lang-delivery`).
- **Addresses:** every container gets `data-block` — `npm run widgets:ids` stamps them; the highlight of the tab «Live site» sees only those,
  and you answer with the link `#block=<bid>` of what you changed — skill `use-highlight`.
- **Only shadcn:** never a raw `<button>`, `<input>`, `<table>`, own toast or window — skill `use-shadcn`; an own look is
  `Button variant="bare"` with the module's class.

## Its door — inside the branch

A widget that reads or writes on the server has its own door in the same branch:

```
<branch>/api/<name>/route.ts      → /<lang>/<branch path>/api/<name>
```

- The client calls `/${lang}/…/api/<name>`; the proxy passes such an address straight to the handler, in every language mode.
- **The door guards itself.** The proxy's gate covers only `/api/*`, not branch doors: check the role by session
  (`getSession`) or limit by address inside the handler. A door for visitors without sign-in still sets a limit.
- POST only needs no `export const dynamic` — and `force-dynamic` in the public branch is refused by the static guards.
- **Moving a door:** find every caller by the door name, not the full address — callers build it from parts
  (`` `/api/settings/${kind}` ``). ✗ 2026-10-07: a search for the literal address missed two of them, and the settings page
  answered «Settings did not load» until they were fixed. Keep one function that builds the address and call it everywhere.
- Add the file to `ALLOWED` in `scripts/check-routes.mjs` with its reason; if other agents may call it, name it in
  `OWN-SERVICE-PROPS/A2A-CARD.json` with the path `/[lang]/…/api/<name>`.

## The island when the server does not answer

A dynamic widget first renders a skeleton of its own shape, then fills in. When its door fails or the computer is off (the
page is served from the Cloudflare copy), it shows that skeleton with a short line of words — never an empty box and never
an error page: the rest of the page keeps working.

## Finish

- End the answer with the link `#block=<bid>` of the page item and of the widget's outer container (read after
  `npm run widgets:ids`) — skill `use-highlight`.

- A `README.md` in the widget's folder: what it does, where its words come from, which door it calls.
- `npm run prebuild` passes (`check:page-sequence`, `check-protected`, `check:lang-delivery`, `check-routes`).
- The deletion test: removing the branch folder leaves nothing of the widget anywhere else.
