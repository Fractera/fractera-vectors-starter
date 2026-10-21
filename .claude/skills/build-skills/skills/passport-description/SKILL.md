---
name: passport-description
description: Builder skill. Write this element's passport texts — name, short description, long description, what it accepts, what it returns — in OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json, so that the elements of the node find it by meaning. Use when the person presses «Generate description» on the passport page of the node core, or asks to describe the element or rewrite its description.
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# Passport description

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

The passport (`OWN-SERVICE-PROPS/README.md`) is the element's main door: the node core indexes it, the elements of the node get it
with one request. Its texts are how another element of the node — an agent searching by meaning — finds this element and
decides to work with it.

## Describe the job, not the builder

Every element born from the starter can build itself — pages, design, data, its own code. That ability is innate and identical
everywhere, so it is never in the passport: a searcher cannot tell two elements apart by it. Describe only the job this element
was made for — what it does for whoever calls it. «Takes a text instruction and returns an image» is a description; «a site with
pages, roles and a design system» is the starter, not this element.

## Learn the element from its own files first

Pages and their texts (`app/[lang]/**/_pages/`, `content/`), the A2A endpoint and the skills it serves (`app/api/a2a`, `lib/a2a/`),
the doors under `app/api/`, the agent's skills in `.claude/skills/`. Write only what the code does today — a claim the element cannot
keep sends a caller to the wrong place.

## The fields you write

| Field | Limit | What it says |
|---|---|---|
| `name` | short | the element's name as a person would say it |
| `shortDescription` | ≤ 500 characters | the task it solves and for whom, in one or two sentences |
| `longDescription` | ≤ 10 000 characters | what it does, how one works with it, what it does not do |
| `accepts` | a few sentences | an example of what one sends it for its job: a question, a file, an order — in plain words |
| `returns` | a few sentences | an example of the result of its job: what the caller gets back |

Never touch `id`, `visibility`, `calls` — those are the person's decisions.

## Written for search by meaning

Name the problem in the words of the one who has it, then the solution. Use the plain words a searcher types and their common
synonyms; avoid our internal terms (WEB4 ITEM, node, element) unless the reader needs them. Concrete nouns and verbs, no slogans.
No personal data — the file is public.

## Before writing — and the core must get it

The passport texts are published (`.claude/modes/build.md`, section «Texts»). Write them into the passport, run them through `humanizer`, then
`npm run check:passport` and fix everything red. Show the person the texts in the terminal and ask «save?». After «yes»: commit with a
message naming the passport, then `npm run describe:publish` — it must print `DESCRIBE_OK`; on `DESCRIBE_FAILED` fix what it names and
run it again. After «no»: put the passport back (`git checkout -- OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json`) or change it as they say.

Only `describe:publish` hands the texts to the node's core — its registry, the passport page and the discovery alarm on this element's
home page. Without it the texts stay in this folder and the core keeps saying «no description» (node step 551-8: a request in the
person's own words came here and stopped at the commit). A capability card description (section above) ends with its commit: the core
reads that field from the passport file itself.
