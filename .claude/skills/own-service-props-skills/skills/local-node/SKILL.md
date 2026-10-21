---
name: local-node
description: >
  Both natures. How a Fractera node works fully on the person's own computer without being public on the internet — the agents, the data and
  the automations at home, with the Telegram bot as a remote control — what it is good for, what it cannot do, and how to switch
  between private and public. Load it whenever the person says they do not need a website, «only agents», «just for me», «home
  automation», «keep it private», «I only want to buy services from other agents», asks whether the node is useful without a
  domain, or asks how to take it off the internet. The thing you cannot guess: a node with no public address is not a lesser
  node — the Telegram channel needs no domain and no open address, because the computer itself polls Telegram.
---

<!-- PROOF · PROVEN 2026-10-07: loaded for «only agents, no site», answer right · report: development-docs/proofs/2026-10-07-node-skills.md -->

# local-node

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: both** — a task that changes the element is building (code, commit, rebuild, the three confirming lines); a job is working (data only, a short answer). `.claude/modes/build.md`, «Confirm the request first».

## What it is

The node runs on the person's computer as a server for them alone: elements on `localhost`, the core's panel on this machine,
nothing published. `npm run serve:unpublish` takes the node off the internet (it keeps running, and later starts stay private);
`npm run serve:publish` puts it back.

## Why it is a whole architecture, not a cut-down one

- **The Telegram bot is the remote control.** The channels plugin asks Telegram from this computer — no domain, no tunnel, no
  open port. From a phone anywhere the person writes to an element's agent, and it works on the computer at home.
- **Agents, data and automations stay here:** the data element stores, the agents process, schedules and tasks run on the
  person's machine and subscription.
- **i2i inside the node** — elements call each other's agreed APIs directly with the node key, no internet involved.

## What it is good for

- Development and automation for oneself: an agent that builds, checks and reports by Telegram.
- Storing and processing personal information that should never be public: notes, documents, records, reports.
- Home automation: tasks on a schedule, answers and summaries sent to the person's Telegram.
- A **buyer node**: an agent that only buys other agents' services over a2a (through Lagrix) and offers nothing — it needs no
  public page.

## What it cannot do

- No visitors, no public pages, no sign-in for other people, no copy of pages for when the computer is off.
- Other nodes cannot call its elements (nothing is published); it can still call out to public services.
- The computer must be on: asleep — the bot is silent, nothing runs (skill `computer-off`).
- One process polls the bot at a time (a second one gets 409); the Claude subscription is shared with the person's own work.

## Going public later

Nothing is rebuilt: `npm run serve:publish` for a temporary address, then an own domain (skills `temporary-domain`,
`cloudflare-connection`).
