---
name: use-eyes
description: >
  Builder skill. Your eyes — `npm run eyes -- <address>`: a windowless browser opens a page of this element, clicks, screenshots
  and tells what covers what. Load it before showing anything you built to your person, before «done» on anything a visitor sees,
  and when a layout may look wrong. Someone else's interface is not this — see `connect-own-domain`.
---

# use-eyes — see it before you show it

**Process: build** — you check what you built; nothing changes in git by looking.

**A built surface is SEEN before it is shown** (CLAUDE.md §7). «The class is in the build» proves the code arrived, not that the page
looks right. ✗ 2026-11-04, the node's core: a drawer proven by its CSS in the chunks was shown to the owner twice — with a hole on top
and a shift too big. One screenshot would have shown both.

## The command

```
npm run eyes -- <address> [--click "<text or css>"]… [--measure "<css>"]… [--top] [--width 390] [--dark] [--full]
```

- **The address** — your page on this computer: `http://localhost:<your port>/<lang>/<path>` (your port — `npm run passport -- me`).
- It prints the browser, the answer, the title, the screenshot path in `logs/eyes/` (outside git), every console and page error, and
  for each `--measure`: the box and «виден», «ПЕРЕКРЫТ: <who>» or «вне экрана».
- **Open the PNG and look at it** — the Read tool shows images. A number does not see a broken rhythm, a hole, an item that fell to a
  second row, a colour lost in the dark theme.
- `--click` opens what a person opens (a menu, a drawer, a tab) before the screenshot; several clicks run in order.
- `--width 390` — a phone; `--dark` — the dark theme; `--top` — scroll to the start (a page that scrolls itself on load hides what is
  above); `--full` — the whole page.

## What it is and is not

- The node keeps ONE browser for all its elements (like REA and the study browser): this command calls the core's. `===EYES_FAILED===`
  or `===EYES_NO_BROWSER===` — say it in one line to your person with what it printed; never claim a page «looks right» without it.
- A clean browser every run: no person's session. On `localhost` your pages open as the owner at the keyboard sees them; say so when a
  visitor's view matters — a page that looks right to the owner may ask a visitor to sign in.
- Your own pages only. A foreign site you study goes through the study pass (`npm run study`, `.claude/modes/build-study.md`); a foreign
  interface the person works in (DNS, Google keys) — their Chrome (`connect-own-domain`).

## Before you call it seen

Name what you measured: the address, the width, the theme, what was clicked — then show your person the screenshot path or say what it
showed. Two widths for anything a visitor sees: the desktop and `--width 390`.
