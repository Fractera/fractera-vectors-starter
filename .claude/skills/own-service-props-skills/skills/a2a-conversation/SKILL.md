---
name: a2a-conversation
description: Both natures (every element). The commands of the A2A wire, `npm run a2a` — find who can do a job, read its card and passport, send a task or call a code skill, follow it, answer tasks sent to you. A native element uses the wire only for i2i with the elements of this node, to agree an API (skill use-i2i). Load it when you need one of these commands, whenever a line «A2A task <id> from <who>…» is pasted into your terminal, and whenever the person comments on a conversation with a neighbour.
---

> **Three protocols (owner 2026-10-11).** Talking to an element of THIS node is **i2i**: meet it as A2A describes below, and aim
> at a connector — an agreed API call — so that the next time no model is needed (build). A native element talks only to the
> elements of its own node.

<!-- PROOF · PROVEN 2026-10-06: answered A2A tasks with npm run a2a -- reply (three live runs) · report: development-docs/proofs/2026-10-06-wake-and-a2a-skills.md -->

# A2A conversation

**Process: both** — a task that changes the element is building (code, commit, rebuild, the three confirming lines); a job is working (data only, a short answer). `.claude/modes/build.md`, «Confirm the request first».

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

## Why A2A, and why one command

Every element of the node is a black box for the others: its code, memory and tools are its own and change without warning.
What stays stable is the conversation. So when you need sign-in, a table, settings or anything you do not own, you do not read
the other element's files and you do not copy its code — you ask its agent. If what it offers fits, use it; if nothing fits,
agree on the API you need, the other side builds it in its own code, then you use it. That keeps every element replaceable.

The protocol itself is not your work: `npm run a2a` runs the official A2A SDK client (A2A v1.0.0), which builds every message,
reads every answer, sends the node key and keeps non-Latin text intact. Never hand-write JSON-RPC or call `curl` for A2A.

Roles: the **person** sets the goal and talks only to their own agent — you; **you** call neighbours on their behalf; the
**neighbour** is the server.

## Find who can do it — two looks

1. **Short — the node.** `npm run a2a -- find <plain words of the job>` ranks the elements of the node by your words (the core's
   A2A registry), at most five, one sentence each. There is no list of all elements: it would grow with the node.
2. **Full — the candidate.** `npm run a2a -- card <address>` (its skills with examples) and its passport
   `GET <its url>/api/own-service-props` (long description, what it accepts, what it returns). Decide here, before the first
   message — not after.

Not in the registry → no A2A card yet → it cannot be talked to today: tell the person instead of going around it. Nothing in the
node fits → say so plainly and go on with the order «Before you build a new capability» (`.claude/modes/build.md`, «Steps», 1b: f2f for a
custom element, then the build here).

## Talk to it

```
npm run a2a -- send <address> "<one or two sentences for the person: what you ask and why>" --title "<topic, 3–6 words>"
npm run a2a -- send <address> "<sentence>" --skill <its skill id> --input '<json>'     # a code skill: answers at once
npm run a2a -- status <address> <taskId>                                              # a task for its agent: answers later
npm run a2a -- send <address> "<follow-up>" --context <contextId>                     # same conversation
```

Why each part matters:
- **The sentence** is what the person reads in the core's feed and in Telegram — write it in your person's language, plainly.
- **One conversation, one `--context`.** The first `send` prints a `contextId`; pass it to every follow-up, or the feed splits
  one conversation into two.
- **A task for its agent wakes that agent** — check `status` no more often than every 30 s. «Waiting: not enough free memory…»
  is a queue, not a refusal.
- **`TASK_STATE_INPUT_REQUIRED`** — read its text first, it means one of two things:
  - «The agent is waiting for its person to allow an action in its terminal» — the neighbour's agent stopped on a permission
    question of its own person; there is nothing for you to answer. Wait and check `status` later; it goes back to `WORKING`
    once that person allows or refuses (node step 418-4). Tell your person only if they are waiting on this task.
  - any other text — the neighbour asks *you*: answer with `send … --task <taskId> --context <contextId>`; what you do not know,
    ask your person and pass their answer on.
- **No keys, tokens or passwords in a message** — they would leave this machine. The core's log records every call by itself.

## A task came to you

A line «A2A task <id> from <who> (conversation <contextId>)…» pasted into your terminal is a neighbour asking you (i2i) or an agent of
another node (a2a). A request you would have to build for is an i2i agreement — skill `use-i2i`; anything else is normal work —
your nature for it follows CLAUDE.md. Then answer:

```
npm run a2a -- reply <id> "<the answer in plain words>" [--data '<json>']
npm run a2a -- reply <id> "<why it did not work>" --failed
```

The caller, the core's feed and Telegram see the answer.

## An API was agreed — record the link

A neighbour agreed an API with this element over i2i (not a question, not a refusal): add the link to your card `consumes` with
its `protocol` and `via` (skill `use-i2i`) and the neighbour's `id` to `calls` in `OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json`, in
the same commit as the work it produced. Stop using a partner — remove it in the commit that removes the use. Why: `OWN-SERVICE-PROPS/README.md`, «Where
`calls` comes from».

## The person comments on a conversation

Take the comment in; if it changes what you asked, `send` the neighbour the substance of it in the **same** `--context`; then
tell the person what you passed on and what the neighbour answered. Never send the person to the neighbour.

The wire shapes, if you ever need to read a raw answer: `references/protocol.md`.
