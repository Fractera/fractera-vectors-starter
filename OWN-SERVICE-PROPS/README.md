# OWN-SERVICE-PROPS — what this element tells the outside about itself

## Why this file exists

This JSON is how the element is **found and understood from outside its folder**:

- the node core indexes it (the node's registry of its elements);
- anyone can ask for it with one request: `GET /api/own-service-props` — no key;

## Only the working nature

An element has two natures (owner, 2026-10-06). **Building** — it can program itself: pages, design, data, its own code. That is
innate: every element born from the starter can do it the same way, so it tells a stranger nothing and never goes here.
**Working** — the job this element was made for (for example: takes an instruction, returns an image). That is what makes it
unique, and only that is described here: the short and the long description, what it accepts and what it returns are all about
the working nature.

## The one rule for a field

A field belongs here only if **both** are true:

1. someone outside the element needs it to find the element or to decide to work with it;
2. it cannot be read from the element's own files (code, `.claude/`, `package.json`, `.env.example`).

The agent reads its own files directly — repeating them here has no value and only makes copies that drift apart.
No private data: the file is public. A key is never here, not even its variable name.

## What lives in this folder

| File | What |
|---|---|
| `OWN-SERVICE-PROPS.json` | what only the agent or the person knows |
| `A2A-CARD.json` | the Google A2A card body — skills, examples, the node extension; its name, description and version come from this passport when it is served (`/.well-known/agent-card.json`), never a second copy |
| — | a native element keeps no showcase, no subscriptions and no schedule: it has no working process (node step 551-1, owner of the node 2026-10-20) |
| `README.md` | this page: why the file exists and the rule for a field |
| `server.ts` | the door: the file + fields computed at the moment of the request; `app/api/own-service-props/route.ts` only re-exports it |

## Fields written in the file

| Field | Who writes it | Why it is here |
|---|---|---|
| `id` | birth | permanent identifier: the core and other agents keep track of the element by it; name and address change, `id` never |
| `name` | agent (skill `passport-description`) | the name a person would say |
| `shortDescription` | agent | ≤ 500 characters: the task it solves and for whom — the first thing search matches |
| `longDescription` | agent | ≤ 10 000 characters: what it does, how one works with it, what it does not do |
| `accepts` | agent | an example of what one sends it for its job |
| `returns` | agent | an example of what it returns — the result of its job |
| `designSkill` | agent (skill `custom-design`) | the design skill this element is built with (`impeccable`, `design-taste-frontend`, …), `""` when none — always present; the core takes it into its registry (owner 2026-10-07) |
| `isFracteraArchitecture` | birth (template), then agent | `true` when the element is built on the Fractera architecture (born from a Fractera starter), `false` for a custom template or a plain React/Express app — an agent knows which contracts (page tree, blocks, design, A2A doors) it can rely on (owner 2026-10-07) |
| `framework` | birth (template), then agent | the framework inside: `next`, `react`, `express`, … — an agent decides whether to connect this element to its project (owner 2026-10-07) |
| `elementType` | template | which template the element comes from: `native` — a root element of every node, added only from the Fractera repository (`fractera-native-item-starter`), never sold; `custom` — born by the node's button «Create WEB4 ITEM» from `fractera-custom-item-starter` |
| `visibility` | person | `network` — seen outside the node; `node` — through the tunnel it answers as absent |
| `calls` | template, then agent | elements this element cooperates with — node-private, returned only with the node key (see «Where `calls` comes from») |
| `messengers` | template, then person | which ways of talking the element has, true or false: `h2a` (the person and this agent), `h2h` (people through their agents), `a2a` (agents); the core shows the H2A / H2H sections and the new A2A pages by these flags and takes them into its registry (owner 2026-10-13, step 472) |

## Where `calls` comes from

- **Born with four.** `auth`, `data`, `config`, `design` are there because the element template was built to cooperate with
  these four services of the node from its first start: sign-in, stored data, project settings, design. They are the template's
  decision, not something this element found.
- **Every later entry has one origin: an i2i agreement.** An entry is added only when the agent found a suitable element in the
  node and the two agreed an API — the conversation in which the other side agreed to build and serve it (skill `use-i2i`;
  commands — `a2a-conversation`). The agent adds the other element's `id` in the same commit as the work that the cooperation produced.
- **Not added:** an element that was only looked at, asked once without an agreement, or refused.
- **Removed:** when the element stops using that partner — in the same commit that removes the use.

**The link itself lives in the card** `A2A-CARD.json`, extension `consumes`: `skill`, `from`, `why`, `protocol` (`i2i` | `a2a`) and
`via` — the API (`{ kind: "http", method, path, base, key }`, `{ kind: "mcp", tool, path, base, key }` or `{ kind: "a2a-skill", skill }`).
`npm run passport -- me` prints these links first; `npm run check:a2a-card` refuses a link without its protocol and API.

`calledBy` is the other direction and is never written: the door reads it from the node's A2A log.

## Fields computed by the door

Never written in the file — they would be copies that drift. The door reads them on every request, grouped as below; the same
values the core shows on its node-state indicator and its «Dashboard → Projects» summary.

| Group · field | Source | Open or node-only |
|---|---|---|
| `skills` | `.claude/skills/*/SKILL.md` whose description starts with «Work skill» — only this element's own working skills | open |
| `tools` | `_tools/TOOLS.json` (generated from `_tools/tool-*/tool.json`) — names only, no descriptions: an agent choosing between elements sees how rich each one's tools are | open |
| `addresses.internet` | own domain, else `<address>.<zone>` | open |
| `addresses.ownDomain` | `SERVICE_DATA_DIR/domain.json`, else `""` | open |
| `addresses.project` | the node's zone (`NODE_DOMAIN_FILE`) | open |
| `addresses.routes` | the element's own `/sitemap.xml` — public pages, paths only | open |
| `host.place` · `placeSource` | the core's node state: `home` / `server` / `unknown`, declared by the person | open |
| `host.reach` | the core's node state: how the node is reached (measured) | open |
| `host.tunnel` | `NODE_DOMAIN_FILE` → a Cloudflare tunnel id exists | open |
| `host.isolation` · `isolationSource` | the core's node state: `none` / `container` (measured) | only with the node key |
| `host.publicIp` | `SERVER_IP`, else `""` | only with the node key |
| `version` | `package.json` | open |
| `commit` | last commit `hash`, `subject`, `count` of commits | open |
| `created` / `updated` | first and last commit of the element | open |
| `github` | `SERVICE_DATA_DIR/github/state.json` | open |
| `author.name` / `author.email` | APP-CONFIG (the core's CONFIG copy) | name open · e-mail only with the node key |
| `machine` | `port`, `localUrl`, `folder`, `status` — the element on this machine | only with the node key |
| `calls` | the file (see above) | only with the node key |
| `calledBy` | the core's A2A log — real elements of the node only, names | only with the node key |
| `project` | the core's composition of the node: `domain`, `core`, `elements` (id, name, native/custom, short description, url, status), `cooperation` (i2i), `a2aRegistry` | only with the node key |

The node key is the header `X-Node-Key` (`SETTINGS_SECRET` of the node). The core asks with it; a stranger gets the open part.

## How the element's own agent reads it

`npm run passport` — asks the running door on this machine with the node key from `.env.local` and prints the whole passport.
The agent learns itself from it (skill `own-service-props-detection`; the block `node` says where it lives) and finds a neighbour by need (skill `node-elements-detection`):
how to work with another element is agreed over i2i (skill `use-i2i`) and the agreed API is written in the card `consumes`.

## How the texts are written

The core's passport page has a button «Generate description»: it opens this element's terminal with the task, and the agent
follows the skill `passport-description` — reads its own code, shows the texts, writes them after the person's «yes».

## State

Built anew on 2026-10-06. The old root file that mixed everything was taken apart: this passport, `A2A-CARD.json` here, and `NODE-CONTRACT.json` at the root (what the node needs to install and manage the element — never served outside). The core reads both layouts through one module (`lib/agi-items/element-props.cjs`), so elements still on the old file keep working.
