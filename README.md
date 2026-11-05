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
An element's own key (`X-Element-Key`, node step 654-1 — the database README tells how it is made and checked) opens the `/vectors/*`
doors and `/capabilities` on that element's own collections only (see «Whose vectors»); a key that does not match gets 401.

| Door | Method | Gives |
|---|---|---|
| `/health` | GET | `{ ok: true }`, no key |
| `/capabilities` | GET | the doors, the model and size of embeddings |
| `/vectors` | POST | `{ id?, collection, text, embedding?, refTable?, refId? }` → `{ ok, id, dims, model, index }`; same `id` replaces — an element's only its own |
| `/vectors/search` | POST | `{ collection?, query \| embedding, k? }` (k ≤ 100) → `{ ok, scanned, index, indexed, results }`; no `collection` — the node: the whole store, an element: each of its own collections |
| `/vectors/:id` | DELETE | `{ ok, deleted }`; an element: another's or a missing id → 404 |
| `/vectors/status` | GET | `{ ok, configured, model, dims, embeddings, setAside, index, indexed, extension, count }` — `configured`: the node's `embeddings` answers ready with this store's model; an element: `count` of its own records, no `setAside` |

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

## Where the vectors come from

A text that arrives without a ready vector (`POST /vectors` with `text`, `POST /vectors/search` with `query`) is counted by the
node's own element **embeddings** — `paraphrase-multilingual-MiniLM-L12-v2`, 384 numbers, on this computer, no key and no internet
(node step 626-3). The store learns its model and size from that element (`GET /api/embed-status`) when it opens, and records them
inside itself (`store_meta`). A caller may still bring a ready vector — it must have the store's size.

Until node step 626 the store counted with OpenAI `text-embedding-3-large` (3072 numbers) and needed an OpenAI key.

## Changing the model

Changing the model means recounting every stored vector, and only the owner decides it (a new model of the embeddings element).
When the store opens and its recorded model is not the one `embeddings` names, the whole file is **set aside** — renamed beside it,
`data/vectors.<model>-<date>.db` (a store from before 626: `data/vectors.openai-<date>.db`), never read again and never deleted —
and a new empty store is made (the owner, 2026-11-02: «Нет, начать с чистого листа»). `/vectors/status` names the set-aside file.
The elements that keep vectors here store their texts again by their own paths.

## How the search works

The index is an sqlite-vec `vec0` table partitioned by collection: a search touches only its own collection and reads only the
k nearest rows; the exact cosine score is then computed for those rows. Three modes are decided at start and reported by
`/vectors/status`: `partitioned` (the correct one), `flat` (an older extension, global search then filter) and `scan` (no
extension: a linear scan that still works). A failing index drops the store to `scan` with the real error in the log —
a fast empty answer never passes for a working one.

## Whose vectors (node step 654-3)

The owner of the node, 2026-11-05: «объектное хранилище должно быть обновлено не только для использования глубинной памятью но и для
использования просто внутри элемента» — the same rule for every store of the node, in both node types.

- **An element's names are its own.** With an element's own key, its collection `faq` is kept as `el/<element id>/faq` and its record
  `x` as `el/<element id>/x`; every answer gives the element its own names back (`faq`, `x`), never the prefix. The partition of the
  index stays the collection, so a search still reads one collection.
- **An element writes, finds, counts and deletes only its own.** The same `id` replaces only its own record; a search with `collection`
  reads its own collection of that name, a search without one reads each of its own collections and merges the findings by score (until
  654-3 it read every collection of the node); `DELETE` of another's record answers 404, the same as a missing one; `/vectors/status`
  counts its own records. A name beginning with `el/` from an element is refused (400 `reserved-prefix`): the store adds the prefix
  itself. An element id holds no slash, so no name of one element — `../root/faq` included — reaches another element's.
- **The node sees everything** (its key, a privileged session): its own collections as before (the deep memory's `memory-said--<element>`,
  the core's diary `memory-<agent>` and the elements' descriptions `node-elements` stay where they are), an element's collection named in full (`el/root/faq`), findings named
  by their element, any record deleted by its full id. The node never writes under `el/` (400 `reserved-prefix`): that prefix is the
  elements'.
- **What it does not do:** vectors an element kept under the node's names before 654-3 stay the node's; the element stores its texts
  again by its own paths, as after a model change. All collections lie in one file of this element (`data/vectors.db`); all elements run
  as one user of the computer, and an element's agent is held off the neighbours' files by the node's boundary hook on named paths, not
  by the operating system.

## Where things live

- `lib/data-store/vectors.mjs` — the vector handlers of the former `server.js`, moved verbatim; whose names a call works on (654-3).
- `lib/data-store/app.mjs` — opens `data/vectors.db` (own file since step 550), sets aside a store of another model, the order of
  the doors.
- `lib/data-store/context.mjs` — the door to the node's embeddings element (`EMBEDDINGS_URL`, the node key).
- `app/vectors/[[...path]]/route.ts`, `app/health/route.ts`, `app/capabilities/route.ts` — the route files.

## Environment

`DATA_SECRET` (shared: the lock of the doors), `SETTINGS_SECRET` (shared: the node key sent to embeddings), `EMBEDDINGS_URL`
(derived: the node's embeddings element; empty — texts are refused, ready vectors still work). No OpenAI key is read for vectors;
`OPENAI_API_KEY` stays only for the site's voice input and translations.

## Extending

A new vector door: a handler in `lib/data-store/vectors.mjs`. A new root segment needs a route file, a line in
`DATA_DOOR_ROOTS` of `proxy.ts` and in `scripts/check-routes.mjs` — and the database element must pass it here too. Changing a
door is the owner's decision.

## What it does not do

It is not a knowledge graph (that is the graph element) and it does not decide what to store: elements send their texts.

## Proven by

Step 626-3: a text stored without a vector is found by a question in other words, a store of the OpenAI model is set aside whole
(the node's completed-steps/626-3.md).

Step 550: the same requests to the former data service and to this element return the same status and shape
(`/code/scripts/agent-tokens/door-parity.mjs`); a stored vector is found again by a search with a ready vector.

License: MIT.
