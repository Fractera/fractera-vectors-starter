---
name: soft-navigation
description: >
  Builder skill. Moving between pages stays a soft client-side Next navigation — header, menu and islands stay mounted — and how
  to prove it, at home and on the own domain. Load it when a task adds or changes a link, a menu, a layout, a redirect, when the
  person says «the menu blinks», «the page reloads», «state is lost between pages», «меню моргает», and before reporting
  navigation works.
---

<!-- PROOF · PROVEN 2026-10-12 · report: development-docs/proofs/2026-10-12-six-skills.md (in roman) -->

# soft-navigation

> A hint, not a law: if you know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## What «soft» means here

A click on an internal link must not load a new document. Next fetches only the data of the next page (a request with the
header `RSC: 1` and a `?_rsc=` parameter, answered with `text/x-component`) and swaps the page inside the same document. What
lives in the shared layout — the header, the menu, the footer, open drawers, the theme, the account button — is not re-created,
so nothing blinks and no state is lost. A full reload re-creates all of it: that is the blink people see.

## The rules for code

- **Every internal link is `next/link`.** A plain `<a href="/…">` to a page of this site is a full reload. Plain `<a>` only for
  absolute addresses (`https://…`), files and `#anchors`; the shell already does this (`components/shell/shell-href.ts`,
  `isAbsolute`).
- **The header, the menu and the footer live in the shared layout** (`app/[lang]/layout.tsx` → `TopMenu`), never inside a page or
  a page widget — a header drawn by the page is re-created on every navigation even when the navigation is soft. Never draw your
  own `<header>`/`<nav>` (skill `use-site-menu`, guard `check:menu`).
- **No navigation by hand.** No `window.location = …`, `location.href = …`, `location.reload()`, `router.refresh()` after a click,
  and no `onClick` that rebuilds an address and assigns it — use `Link` or `router.push`.
- **Do not switch prefetch off wholesale.** `prefetch={false}` only where the target must not be fetched ahead (sign-in, sign-out).
- **Nothing in the root layout that makes it dynamic** (`cookies()`, `headers()`, `force-dynamic`) — skill `use-page-tree`.

## How you prove it — two checks, both

**1. The window marker (the browser).** Open a page, set a marker, click two menu items, read the marker:

```js
window.__soft = 'alive'
// click a header link, wait, click another one, then:
window.__soft   // 'alive' → soft navigation; undefined → the document was reloaded
```

If the evaluation dies with «target navigated», the document was reloaded — that is the answer too.

**2. The navigation request (the network), on every address people use — `127.0.0.1:<port>` and the own domain:**

```bash
curl -s -o /dev/null -D - -H 'RSC: 1' "https://<domain>/<lang>/<page>?_rsc=check" | grep -i content-type
```

`text/x-component` → correct. `text/html` → the navigation is broken on that address, whatever the code says.

## When the code is right and the domain still reloads

`text/x-component` at `127.0.0.1` and `text/html` on the domain means the Cloudflare copy of the site answered instead of this
computer. The copy belongs to the node's core (`scripts/static-copy.mjs`), not to this element: **do not patch the element** (no
hacks around `Link`, no disabling the copy). Report it to the core with both `curl` outputs. ✗ 2026-10-12 (node step 455): every
menu click on the node's domains was a full reload — Cloudflare serves a file of the copy
before the Worker runs, by path only, so the `RSC` header was never seen; fixed in the core with `run_worker_first` for page
paths. A copy made before that fix still breaks navigation until the element is deployed again or «Update copies» is pressed.

## What it does not cover

Speed of the first load, caching of data, animations between pages — other skills.
