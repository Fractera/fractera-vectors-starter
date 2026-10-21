---
name: add-door
description: Builder skill. A door for the other elements of this node (i2i) — POST or GET /api/<name> with the node key. One command makes the route, the key check, the closed-list line, a test and the card entry; you write only handle(input). Load when a neighbour or your person asks this element for an API door.
---

<!-- PROOF · NOT PROVEN yet: written 2026-10-20 (node step 548-16); the recipe is checked by its guards, the skill by the live run of 548-19 -->

# Add a door

**Process: build** — code, commit, rebuild; the three confirming lines of `CLAUDE.md` first (a neighbour's request: on top of your reply).

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

1. `npm run door:add -- <name> --says "<what it does, 6-12 words>" [--method GET]` (POST by default) writes
   `app/api/<name>/route.ts` (key `X-Node-Key` through `lib/node-key.ts`, JSON in and out), `<name>.mjs`, `<name>.test.mjs`,
   the line in `scripts/check-routes.mjs`, `test:<name>` and the door in `OWN-SERVICE-PROPS/A2A-CARD.json`.
2. The work goes into `<name>.mjs`: `handle(input)` returns `{ status, body }`; input it cannot use — 400 or 422 with
   `{ error, reason }`.
3. Real samples in `<name>.test.mjs` → `npm run test:<name>`.
4. The card: a real input and output, the errors, `callers` (element ids); the passport `accepts`/`returns` (`passport-description`);
   then `npm run check:passport` — the core's guard of the card — prints no violation: a card the core rejects is not published, and
   the element cannot be discovered (node step 551-2).
5. One commit → `npm run describe:publish` → deploy (`deploy-element`) → live: no key 401, with the key 200.

Nothing here needs `proxy.ts`, the guards or another door read first: a neighbour calls `http://127.0.0.1:<port>/api/<name>`
on the machine's loopback, the gate of `proxy.ts` lets the loopback through, and the key decides. `npm run` prints every
command this element has; `package.json` and `proxy.ts` are your own files — open them when a task is about them.
