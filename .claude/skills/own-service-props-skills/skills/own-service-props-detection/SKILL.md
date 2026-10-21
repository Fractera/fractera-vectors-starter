---
name: own-service-props-detection
description: Both natures (every element). Learn who you are inside this node from the element's passport — your id and name, your address on the internet and on this machine, your port and folder, your version, what you are for, what you sell, and who you cooperate with. Use this at the start of every session (CLAUDE.md asks for it on wake), and any time you are about to state, use or guess your own port, address, domain, project, role, skills or partners — even inside another task, such as building a link, a redirect or a call to yourself.
---

<!-- PROOF · PROVEN 2026-10-06: npm run passport -- me run first on wake, read whole · report: development-docs/proofs/2026-10-06-wake-and-a2a-skills.md -->

# Who I am — from my passport

**Process: both** — a task that changes the element is building (code, commit, rebuild, the three confirming lines); a job is working (data only, a short answer). `.claude/modes/build.md`, «Confirm the request first».

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

## Why the passport, and not your memory

This element does not live alone: the node gives it a port, an address, a domain, neighbours — and changes them without telling
the code (a port moves when another program takes it; an element is renamed; a domain is attached). A value you remember, or read
from one scattered file, is right until the day it moves, and then it is confidently wrong. The passport (`OWN-SERVICE-PROPS/`,
its `README.md` says why it exists) is the element's main door: one request joins what you wrote about yourself with what the node
knows about you right now.

```
npm run passport -- me
```

It asks the running element on this machine with the node key and prints only you — short enough to read whole; never cut
it with `head`. `npm run passport` without a mode is the whole passport (every public route, the node around you).

## What to take from it

| You need | Fields |
|---|---|
| who you are | `id` (never changes), `name` (may change), `version`, `commit`, `created`, `updated`, `github` |
| where you live | `addresses` (internet, own domain, project, your public routes), `host` (home or server, how the node is reached, tunnel, isolation), `machine` (port, local address, folder, status) |
| what you are for | `shortDescription`, `longDescription`, `accepts`, `returns`, `skills` |
| which kind of element you are | `elementType` — `native` — a root element of every node, added only from the Fractera repository (`fractera-native-item-starter`), never sold |
| who sees you | `visibility` — `node`: a native element is seen only inside its node |
| your ties | `calls` (who you cooperate with), `calledBy` (who has called you) |

Empty descriptions mean they were never generated — say so to the person and point them to «Generate description» on the
passport page; do not invent a role for yourself. Writing them is the skill `passport-description`.

## When the door does not answer

`PASSPORT_FAILED` means the element is not running or not installed here. Tell the person, and read only the written part from
`OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json`. Leave the computed fields unknown rather than filling them from memory.

Where you live — the core, the main agent's terminal, how many elements — is the block `node` of the same answer. Another
element, when a task needs one, is found by search, never from a list — skill `node-elements-detection`.
