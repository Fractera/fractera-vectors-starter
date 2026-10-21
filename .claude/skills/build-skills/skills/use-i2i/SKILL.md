---
name: use-i2i
description: Both natures. i2i — how the elements of one node and its core work together. The agents meet once over the A2A wire only to agree an API, the provider builds it, both record the link in their passports, and from then on the work runs over that API with no model; a new need grows the API. Load it when a job needs something you cannot do, when a neighbour asks you for something, when a new element appears in the node, when you record or answer about a link with auth, data, config, design, the core or any neighbour, and before you think of building another element's job into yourself.
---

# i2i — the elements of one node agree an API once

**Process: both** — agreeing and building an API is building (three confirming lines, a commit, a deploy); calling an agreed
API is working (no commit, a short answer).

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions. The meaning of i2i is the owner's
(2026-10-11, 2026-10-19) and is not yours to change.

## What it is for

The elements of a node get to know each other the way A2A agents do, but for one purpose only: to agree how they will work with
the core and with each other **through an API**, so that the work needs few or no model calls. The model is spent on the
agreement, never on the daily work. i2i is the build process.

## The owner's example, from start to end

A node has six native and four custom elements. One makes music, but its tracks carry a metallic screech. Another is quality
control and cannot pass such a track. Through f2f a new element arrives: «I remove metallic screech from music».

1. **The newcomer becomes known.** The core's main agent gives it its purpose if it has none (`shortDescription`), takes its
   description into the core's registry and tells the person what arrived. Nobody broadcasts it to the other agents.
2. **The need finds it.** Quality control hits the screech. Before giving up, and before building it into itself, it searches
   the node: `npm run a2a -- find remove metallic screech music` (skill `a2a-conversation` holds every command). It reads the
   candidate's card and passport.
3. **The agents talk once** — `npm run a2a -- send <address> "<what is needed>"`: what goes in, in what form, what comes back,
   what it may not do. This is the only part that costs a model.
4. **The agreement becomes an API.** The provider builds a door (HTTP) or a code skill (an A2A data part that answers at once).
   That is building, with its three lines and a commit. Then both sides write it down:
   - the provider adds the door to its card `doors` and names in `callers` who may call it;
   - the consumer adds a `consumes` entry: `skill`, `from`, `why`, `protocol: "i2i"`, and `via` — `{ kind: "http", method, path }`,
     `{ kind: "mcp", tool }` or `{ kind: "a2a-skill", skill }`.
5. **From then on it is a plain call.** Quality control sends the track and gets it back clean — no model on either side.
6. **A further need — ask again.** «Can you cut the voice out of music?» — «no» ends it. «yes» means the provider grows its API
   and its description, and the consumer records one more link.

A big result (a track, a picture, a video) is returned as a link to storage, never as the file — `use-h2a`, «Media».

## The links you already have

The starter came with the connectors to **the core, auth, data, config and design** already agreed — they are i2i done in
advance. Use them in code, never through those agents:

| Partner | What | API |
|---|---|---|
| auth | who the visitor is, sign-in | `GET {AUTH_SERVICE_URL}/api/session`; on its own domain `GET /api/auth/ticket` |
| data | rows, files, vectors | its doors at `REMOTE_DATA_URL` with the header `X-Data-Secret` |
| config | name, texts, languages of the project | MCP tools `settings_version`, `get_project_settings` at `CONFIG_SERVICE_URL` |
| design | colours, fonts, corners | MCP tools `get_project_settings` (design), `subscribe` at `DESIGN_SERVICE_URL` |
| the core | who can do a job; waking agents | `GET /api/node/a2a?q=` with the node key; `POST /api/agents/wake`, `POST /api/agents/done` |

## Answering about your links

`npm run passport -- me` prints `links`. Answer from it, protocol first: «with auth — i2i, the ready API `GET /api/session`».
Never read your code to answer: the code shows how a call is written, not what was agreed. A link you find in the code but not
in `links` is a defect — say so and offer to record it (`describe-element`).

## Nobody in the node can do it

Do not grow someone else's job inside yourself. The order «Before you build a new capability» goes on (`.claude/modes/build.md`, «Steps»,
1b): a custom element searches the network for a whole element (f2f), then builds it here when it is your role; a job that is
not your role goes to the core's main agent, which creates a new element for it.

## Never

- read or write a neighbour's files or database — its code changes and you would break silently;
- ask the auth, data, config or design agents for what their API already gives;
- spend a model on a job an agreed API covers;
- wake a neighbour's agent for anything but agreeing an API: a door that exists is called, not asked about;
- build into yourself a capability a neighbour already has.
