---
name: describe-element
description: Builder skill. Describe this element with an A2A card (Google A2A v1.0 + the Fractera extension) so that neighbours in the node and outside agents can find it and call it. Load it in the first session, on the task «Describe this WEB4 element…», and after any change to what the element can do — a new door in `app/api/**`, a new skill, a new need from a neighbour, a process of its own.
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# describe-element

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

Result: `OWN-SERVICE-PROPS/A2A-CARD.json` (the body of the card; name, description and version come from the passport
`OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json`) describes the element truthfully; `npm run check:passport` is green; the node's
record is refreshed with `npm run describe:publish`. The standard is `lib/a2a/STANDARD.md` in the node's core (fields from
`a2a.proto`, JSON in camelCase).

## 1. Look it up — in the code, not from memory

| What to find | Where |
|---|---|
| doors | `app/api/**/route.ts` (method — the exported `GET`/`POST`…, key — what the handler checks) |
| the A2A endpoint and its skills | `app/api/a2a/route.ts`, `lib/a2a/endpoint.ts` (`A2A_SKILLS`) |
| needs from neighbours | the `*_URL` variables in `.env.local` and where the code reads them (`AUTH_SERVICE_URL` → auth, `REMOTE_DATA_URL` → data, `CONFIG_SERVICE_URL` → config, `DESIGN_SERVICE_URL` → design) |
| a process of its own | `instrumentation.ts` (subscriptions to the settings signals at start), signals |
| a catalogue | are there «find / get / add» doors |

## 2. Write the card

- The card's `name` and `description` are NOT written in `A2A-CARD.json`: the served card takes them from the passport — `name`
  and `shortDescription` of `OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json`. Write the passport texts — `name`, `shortDescription`,
  `longDescription`, `accepts`, `returns` — by skill `passport-description`: only what the code does today. A job the element is
  meant to do and does not do yet is said as planned, in one sentence of `longDescription`, never as a fact.
- **A skill** per capability: `id` (kebab-case), `name`, `description`, `tags`, `examples` (how people ask in words),
  `inputModes` / `outputModes` (media types: «I accept / I return»).
- The extension `https://fractera.ai/a2a/ext/node/v1` → `params`: `visibility` (`network` — a public site; `node` — a service
  element), `doors` (per door: `skill`, `protocol`, `method`, `path`, `key`, a sample `input`/`output` JSON, `errors`,
  `callers`), `consumes` (`skill`, `from`, `why`), `process`, `catalog` (`null` if none), `private` (doors not offered to
  neighbours), `a2aEndpoint`, `a2aSkills`.
- Do **not** write `supportedInterfaces` into the passport — the card adds it when served.
- 🪦 The passport has no `summary` and no `provides` (they belonged to the old single-file layout): `describe:publish` hands the core
  the passport's `shortDescription` and the card's skill `id`s. Never add those two fields; remove them if you find them (node step 551).
- A sample answer is taken from a real answer of the door, never made up.
- **A skill that is not served over A2A** (an HTTP door: `/api/me`, the help desk, a settings signal) stays in `skills` — the
  node's neighbour search (`find`) and the core's `provides` read this list, and a removed skill makes the element invisible by
  those words — but it carries the tag `http-door` and its description ends with
  «Not over A2A: an HTTP door — <METHOD path> (extension https://fractera.ai/a2a/ext/node/v1, «doors»)». An outside agent then
  knows to call it by HTTP, not with an A2A message. A skill in `a2aSkills` never carries `http-door`.
  `npm run check:a2a-card` (in `prebuild`) refuses both mistakes.

## What the served card adds by itself — do not write it

`app/.well-known/agent-card.json/route.ts` adds on every request, on the host the card was asked from: `supportedInterfaces`
(from `a2aEndpoint`), `documentationUrl` (`/llms.txt`), `iconUrl` (`/icons/icon-512.png`) and `telegram.connected` (from
the bot folder `SERVICE_DATA_DIR/channel/telegram`: a token and at least one allowed person).
- `A2A-CARD.json` and the passport are read on every request — a change is live at once; a change of the route is code and
  shows after «Preview» → «Accept».
- Check the served card, not the file: `curl -s http://127.0.0.1:<port>/.well-known/agent-card.json` — every field above is
  there, `telegram.connected` matches the bot page. ✗ 2026-10-07: a lost backslash kept `telegram.connected` always false,
  and the file looked right.

## 3. Check and publish

The passport texts are published: run them through `humanizer` → `npm run check:passport` → fix everything red → show the person the
texts and wait for their «yes» → commit the passport (and the card) → `npm run describe:publish`. It must print `DESCRIBE_OK`;
`DESCRIBE_FAILED` names what the core refused (for example a born or template description) — fix that and run it again.

## Do not

- Announce a door or a skill that the code does not have; keep a door in the code that is neither announced nor named in `private`.
- Put secrets, machine addresses or other people's data into the card.
- Give `visibility: network` to a service element.
