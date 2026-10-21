# fractera-vectors — the vector store of a Fractera node

A native element of the node, built on the Fractera native element template. Elements keep pieces of text here as vectors in
named collections and find the ones closest to a question.

It was the vector part of the former data layer (an Express server) until step 550, when the owner split the data layer into
native elements: **data** (the database), **storage** (files), **vectors** (this one) and **graph** (the knowledge graph).
Consumers did not change: they call `/vectors/*` on the database element, which passes the request here as it is and returns
the answer unchanged.

## In the Fractera project

The node's vector store: elements keep pieces of text as vectors in named collections and find the closest ones to a question. Elements reach it through the data element (`/vectors/*`).

You can change it. The code is open under the MIT license and the copy on your node is yours. The node installs this element from
this repository by the tag written in `WEB4-ITEMS-REGISTRY/web4-items.json` of the core; the core does not let you delete a built-in
element or move its address.

To change it, open it in the core (left menu, Native items, Vector storage), go to Build and tell its agent in the terminal what you need.
The agent edits the element folder `WEB4-ITEMS/core/vectors` and commits.

The change goes live when you press Deploy in Build, Deployments: the element is rebuilt beside the running one and switched over in
seconds. Other elements call its doors by address, request and answer, so a change to a door breaks every element that uses it;
that is a decision for the node owner, while a change inside the element is ordinary work. To keep your version when the node is
reinstalled, save the element to your own GitHub repository in Build, GitHub. A newer Fractera version arrives through Update, which
merges it with your commits, and the element's agent resolves a conflict.

## Doors

Every door but `/health` needs the node data key (`X-Data-Secret`, the same `DATA_SECRET` the installer writes to every
element) or a privileged session (architect, admin, agent) checked by the node's auth element. Through the Cloudflare tunnel
(`cf-ray`) every door answers 404, with a key or without. The lock is `lib/data-store/auth.mjs`, word for word the database's.

| Door | Method | Gives |
|---|---|---|
| `/health` | GET | `{ ok: true }`, no key |
| `/capabilities` | GET | the doors, the model and size of embeddings |
| `/vectors` | POST | `{ id?, collection, text, embedding?, refTable?, refId? }` → `{ ok, id, dims, model, index }`; same `id` replaces |
| `/vectors/search` | POST | `{ collection?, query \| embedding, k? }` (k ≤ 100) → `{ ok, scanned, index, indexed, results }` |
| `/vectors/:id` | DELETE | `{ ok, deleted }` |
| `/vectors/status` | GET | `{ ok, configured, model, dims, index, indexed, extension, count }` |

Example — store a paragraph and find it again (through the database element, as every consumer does):

```js
const base = process.env.REMOTE_DATA_URL
const headers = { 'X-Data-Secret': process.env.DATA_SECRET, 'Content-Type': 'application/json' }
await fetch(`${base}/vectors`, { method: 'POST', headers,
  body: JSON.stringify({ collection: 'faq', text: 'Delivery takes two days.', refTable: 'faq', refId: '17' }) })
const r = await fetch(`${base}/vectors/search`, { method: 'POST', headers,
  body: JSON.stringify({ collection: 'faq', query: 'How long is shipping?', k: 3 }) })
const { results } = await r.json() // [{ id, collection, refTable, refId, text, score }]
```

## How the search works

The index is an sqlite-vec `vec0` table partitioned by collection: a search touches only its own collection and reads only the
k nearest rows; the exact cosine score is then computed for those rows. Three modes are decided at start and reported by
`/vectors/status`: `partitioned` (the correct one), `flat` (an older extension, global search then filter) and `scan` (no
extension: a linear scan that still works). A failing index drops the store to `scan` with the real error in the log —
a fast empty answer never passes for a working one.

## Where things live

- `lib/data-store/vectors.mjs` — the vector handlers of the former `server.js`, moved verbatim.
- `lib/data-store/app.mjs` — opens `data/vectors.db` (own file since step 550) and the order of the doors.
- `app/vectors/[[...path]]/route.ts`, `app/health/route.ts`, `app/capabilities/route.ts` — the route files.

## Environment

`DATA_SECRET` (shared), `OPENAI_API_KEY` (foreign: embeddings of texts; without it a text without a ready vector is refused),
`EMBED_MODEL` and `EMBED_DIMS` (text-embedding-3-large, 3072). 🛑 Changing the model or the size on a live store makes every
stored vector unreadable: only on an empty store or with a full reindex, announced in advance.

## Extending

A new vector door: a handler in `lib/data-store/vectors.mjs`. A new root segment needs a route file, a line in
`DATA_DOOR_ROOTS` of `proxy.ts` and in `scripts/check-routes.mjs` — and the database element must pass it here too. Changing a
door is the owner's decision.

## What it does not do

It is not a knowledge graph (that is the graph element) and it does not decide what to store: elements send their texts.

## Proven by

Step 550: the same requests to the former data service and to this element return the same status and shape
(`/code/scripts/agent-tokens/door-parity.mjs`); a stored vector is found again by a search with a ready vector.

License: MIT.
