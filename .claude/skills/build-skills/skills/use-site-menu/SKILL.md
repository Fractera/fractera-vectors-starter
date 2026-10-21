---
name: use-site-menu
description: >
  Builder skill. How the header menu and the footer links of this Fractera element are made — they are settings, not code: the
  items in `APP-CONFIG` (`nav.top`, `nav.footer`), their translated labels, the switches «Top menu» and «Footer pages» in
  `PLATFORM-CONFIG`, the copy from the node's CONFIG that overrides them when the element is linked, the four default legal
  pages, how a link gets its language, and how to check a change live. Load it whenever a task touches the menu, the header,
  the footer, «add a link to …», «put it in the menu», «remove the button», a new page that should be reachable, or the person
  asks why a link does not show. The thing you cannot guess: the footer is OFF by default — items written into `nav.footer`
  stay invisible until the switch is on, and switching it on is the person's decision; and no guard checks that a menu item
  leads to a page that exists.
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# use-site-menu

> A hint, not a law: if you know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## Two menus, owned by the person

The top bar and the footer are the person's settings, edited on this element's page «Site settings» (`admin/site-settings`:
«Top menu», «Project footer», each with «Show this menu»). Side drawers of a branch are different — group manifests on disk,
filled by you. 🛑 Never write your own `<header>` or `<nav>` with links: `npm run check:menu` refuses a second navigation bar —
the person could not manage it.

## Where they live — ask before you edit

| Link to the node's CONFIG | Source of the menu | Where a change is made |
|---|---|---|
| off (`"config": false` in the node's `data/services/<element id>/links.json`; the «Settings» card of the element) | this element's `APP-CONFIG/app-config.json` and `PLATFORM-CONFIG/platform-config.json` | these files, or «Site settings» |
| on | the copy of the person's decisions from the node's element «Project settings» (CONFIG), laid over these files | CONFIG — your file edits are overridden for every key the person set there |

- **Items:** `nav.top` / `nav.footer` — `{ "id", "href", "order", "label", "children": [...] }`; `id` never changes.
- **Labels in other languages:** `i18n["nav.<top|footer>.<id>.label"]["<lang>"]` in the same `APP-CONFIG`; a missing translation shows the base label.
- **Switches** in `PLATFORM-CONFIG`: `topMenu` (default on), `footerPages` (**default off**).
- **The footer** (`lib/menu/site-menu.ts`): switch off → no links at all, whatever `nav.footer` holds. Switch on and
  `nav.footer` empty → four default legal pages (Privacy, Terms, Cookies, Accessible — placeholders the person replaces). Switch on
  and `nav.footer` set → exactly those items.

## Links

- `href` absolute (`https://…`) → used as is. Relative → the language is added: write `/about`, not `/ru/about`; a leading
  language is replaced, never doubled (`components/shell/shell-href.ts`).
- Top-level labels are cut to 12 characters with «…» (one long button breaks the bar on a phone); dropdown items are not cut.
- 🛑 Nothing checks that an item leads to a page. Add an item only for a page that answers, and check it: today `/ru/store` and
  `/ru/blog` from the top menu answer 404 on this element.

## A change is data — no build

The menu is read from the files on request (ISR): after an edit run `npm run pages:refresh`; the next visit on this computer shows it — on the own domain the pages
in the Cloudflare copy keep the old menu until «Deploy» or «Update copies» (skill `use-page-tree`). Other
services of the node draw the same menu through this element's door `/api/menu/<lang>` — they pick it up on their next render,
do not promise it at once.

Before you change anything: `npm run read:menu` prints the top menu as it is now (switch, buttons, children, translations).
The footer it does not print — read `nav.footer` and `footerPages` yourself.

## What is the person's decision

Turning a menu on or off, removing or reordering their items, showing the default legal pages. A task «add a link to the
footer» while `footerPages` is off is not done by writing `nav.footer`: say that the footer is off and ask whether to turn it
on, with only the new link or with the defaults (✗ 2026-10-07: an agent promised «the fifth link next to four» — the footer
was empty).

## How you know it worked

- The live HTML of a page has the new `href` inside `<header>` or `<footer>` (`curl` the element's address, twice after `pages:refresh`).
- The page the item leads to answers 200 in every enabled language.
- A spoil: point the item at a page that does not exist — the link shows and leads to 404, which proves the check above is
  the only guard; restore it.
