---
name: use-tools
description: >
  Builder skill. How the ready capabilities of this Fractera element — voice input, image crop, video trim, code view, a
  translations dialog, socials by AI, a chat, a draft from free words — are found, used inside widgets and added. Load it
  before building anything that records, transcribes, crops, trims, chats or calls a model; whenever the person asks for
  "voice", "dictation", "upload and crop", "a chat on the page", "translate these fields"; and whenever you are about to copy
  such code from somewhere. The thing you cannot guess: a tool is never put on a page and never lives at its first caller —
  it sits in `_tools/tool-<name>/` with a card, the list of tools is generated from those cards, and the passport tells other
  agents what this element can do by that list. A capability built inside one widget is invisible to all of them.
---

<!-- PROOF · PROVEN 2026-10-07: loaded for voice in a widget; tool used only inside a dynamic widget · report: development-docs/proofs/2026-10-07-page-skills.md -->

# use-tools

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## First look — the tool may already exist

`_tools/TOOLS.json` lists every tool with what it does and how (`en` / `ru`); `npm run passport -- me` shows their names.
Open the nearest one before writing anything similar.

## Tool or widget

One question: **will a second caller want exactly this thing?** Yes — a tool. Only this page — a widget (skill `build-widget`).
A tool knows no page and no domain; it does not know where its result goes — the caller passes the door and takes the result.

## Using a tool

- **Only from inside a widget** — directly, or through another tool or a shared component (`components/form/voice-control`
  is built on `tool-voice-input`). A page never names `tool-*` in its sequence (`check:page-sequence` refuses it), and blocks
  never use tools: they must work in any element.
- **Words come from the server.** A tool takes its strings as a prop (`strings`), chosen by the server for the page's
  language; it never imports a dictionary into the browser.
- **Its door** is at element level, because every route may use it: `app/api/tools/tool-<name>/route.ts` — checks the
  caller's role, puts the key in, calls the tool's `server/`. A door whose schema belongs to one page (the field list of
  `tool-fact-draft`) is that page's door, inside its branch.

## What a tool is made of

Only shadcn components and typography — no raw control (skill `use-shadcn`) — and every container of it has a `data-block`
(`npm run widgets:ids` covers `_tools/`; skill `use-highlight`).

## Adding a tool

```
_tools/tool-<name>/
├── tool.json    ← id = folder name · entry · needs (browser · https · openai-key · ffmpeg) · npmDeps · usedBy (real callers) ·
│                  en/ru title · what · how · value
├── client/      ← browser half (the entry)
├── server/      ← when it calls a model or a service
└── types/       ← its types and its words
```

1. The folder and the card; its door if any, plus a line in `ALLOWED` of `scripts/check-routes.mjs` and `/api/tools` stays in
   the A2A card's `private`.
2. `npm run build:tools-map` — the map, and with it the passport's `tools`, follow the cards. Never a list by hand.
3. Commit the map with the tool.

## How you know it worked

`npm run check:tools-map` → `===TOOLS_MAP_OK===`; the passport's `tools` has the new name after a rebuild; `npm run prebuild`
passes. Reference: `_tools/README.md`.
