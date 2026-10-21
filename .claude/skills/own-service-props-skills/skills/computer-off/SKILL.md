---
name: computer-off
description: >
  Both natures. What this Fractera element can and cannot do while the person's computer is off, asleep or has its lid closed — which pages
  still open, what visitors see instead of the rest, what happens to sign-in, forms, the agents, Telegram and A2A — and the role
  of the Cloudflare copy. Load it whenever the person asks «what if I close the laptop», «does the site work at night», «why
  did the bot not answer», «visitors saw "the owner is offline"», and before you promise anything that needs the computer to be
  on. The thing you cannot guess: the computer is the server — only the copy of public pages kept in Cloudflare outlives it.
---

<!-- PROOF · PROVEN 2026-10-07: loaded by its description for «lid closed», answer right · report: development-docs/proofs/2026-10-07-node-skills.md -->

# computer-off

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: both** — a task that changes the element is building (code, commit, rebuild, the three confirming lines); a job is working (data only, a short answer). `.claude/modes/build.md`, «Confirm the request first».

## Still works — from Cloudflare (own domain only)

- **Public pages of every address of the node**, in every language, with their styles and pictures — served from the copy in
  the person's Cloudflare Workers (skill `cloudflare-connection`), as of the last «Accept»/«Deploy».
- **The A2A card** of a `network` element — read from the copy; a call to it gets an A2A protocol error, not an HTML page.

## Does not work

| What | What the visitor gets |
|---|---|
| sign-in, cabinets, admin, any page behind a lock | the page «the site owner is offline» (503) |
| forms, chat answers, voice, anything that asks a door | the island shows its skeleton or its refusal line; the page stays whole |
| data from the database | the island's «not available now» |
| the agents (this one too) and A2A work | nothing runs; an A2A call gets a protocol error — the caller tries again later |
| the Telegram bot | silent: it is polled from this computer, so nobody reads the messages while it is off |
| the temporary address | dead (Cloudflare error 1033/1016) — there is no copy without an own domain |

## What to tell the person

- With an own domain: «visitors still read your public pages; everything live waits for the computer».
- Without one: «while the computer is off the site is not reachable at all — connect your own domain to keep a copy».
- A text change made after the last deploy is not in the copy until «Accept» or «Deploy».
- For a node that must answer around the clock, the computer stays on (or the node runs on an always-on machine).
