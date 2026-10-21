---
name: node-elements-detection
description: Both natures (every element). How to find another element of this node when a task needs something you do not do — sign-in, storing data or files, settings, design, or any ability a neighbour may already have — by searching the node's registry, never by listing the node. Use it whenever a task touches something outside this element, even if the person does not name the other element, and before you think of building another element's job into yourself.
---

<!-- PROOF · CHANGED 2026-10-20 (node step 548-14): a neighbour by search, no list of the node — not proven again yet -->

# A neighbour — by need, never by a list

**Process: both** — a task that changes the element is building (code, commit, rebuild, the three confirming lines); a job is working (data only, a short answer). `.claude/modes/build.md`, «Confirm the request first».

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

## Why search, and not a list

A node holds ten elements today and a thousand tomorrow. A list of all of them on every wake would grow with each new element,
and every agent of the node would pay for it on every wake — the owner of the node, 2026-10-20: the cost of an agent must not grow
with the node. So you hold only where you live (`npm run passport -- me`, block `node`: the core, the main agent's terminal, how
many elements) and look a neighbour up when a task needs one:

```
npm run a2a -- find <plain English words of the job>   # at most five, one sentence each
npm run a2a -- card <address>                          # one of them in full: its skills with examples
```

The registry is written in English: a query in another language finds nothing — search again in English. Read the answer whole;
never go to the core's files around it.

In the answer, `role` is what the node made that element for (the core's main agent gives it); `description` and `skills` are
what its card says is built today. A just-born element still carries the template's card: its `role` is what it is for — ask
its agent, do not rule it out by its card.

## The connectors you already have

auth, data, config, design and the core are i2i agreed in advance — their APIs are in your `links` (`npm run passport -- me`) and
in skill `use-i2i`. Use them in code; never search for them and never ask their agents.

## How you work with a neighbour

By the protocols (`CLAUDE.md`, «Protocols»): with neighbours — **i2i**. Never read or write a neighbour's files: each element owns
its code, and that code changes. If you read the data element's files and wrote to its database yourself, the next change on its
side would silently break you, and it would never know you depended on it. Instead:

1. Find candidates (`find`), read the one that fits (`card`) — the two looks are in `a2a-conversation`.
2. It has a door for this — call it (a plain call, no model).
3. No door — wake its agent once to agree an API; the other side builds it, then you use it (`use-i2i`).
4. Record the link in your card `consumes` with its protocol and API, and the partner's id in `calls` (`use-i2i`).

An element that is not in the registry has no A2A card yet: it cannot be talked to today. Tell the person instead of going
around it.

## When the core does not answer

`find` fails while the core is restarting — ask again in a minute. Do not conclude the node is empty.
