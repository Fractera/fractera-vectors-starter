---
name: use-personal-data
description: >
  Builder skill. How this element holds data about PEOPLE — names, contacts, documents, health, orders, a person's own words — and
  what may leave the computer. Load it before designing a table that holds a person, a form that asks about one, a support or
  medical feature, an order from another agent, and any model call whose input comes from a person; and when the person says
  «personal data», «GDPR», «the data may not leave the country».
---

# use-personal-data

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

The rule everything turns on: **the model receives the CASE, never the PERSON.** The person stays on the owner's computer.

## 1. Two tables, one join, and the join happens here

| Table | Holds | May it leave the computer? |
|---|---|---|
| `<thing>_people` | name, contact, document number, address, date of birth | **never** |
| `<thing>_cases` | `person_id`, the question, the state, the outcome | only the fields a model needs, keyed by `person_id` |

`person_id` is meaningless outside your database (`p_8f3c…`, never an email or `ivanov_1978`). The answer comes back keyed by it and
your route joins it to the person here; only the joined result reaches the screen. Tables live in your own space of the node's data element
(its key, never a neighbour's). Erasure is then one `DELETE` of the person's row; a name copied into every case, log and prompt cannot be erased.

## 2. What leaves this computer, and what does not

- **Leaves:** every model call (skill `use-ai-generation`) and voice transcription (a voice is biometric; people say their name).
- **Stays:** your stores — rows, files, vectors (embedded by the node's own `embeddings`, no outside model) and the graph (no model) —
  each opened only by your key. Check this before you promise it: `npm run passport -- me`, part `node`.
- **Free text is the leak.** A sentence a person typed carries names and numbers in a column nobody marked personal. In this order:
  do not send the body (send structured fields), or scrub and say it is scrubbed (it lowers the leak, it does not close it), or send it
  as the owner's written decision. Never present the second as the first.

## 3. The channels nobody classifies

- **Logs** — identifiers and status codes, never a payload.
- **Error text** — general words from `lib/i18n/platform-errors.ts`, never the input echoed back.
- **URLs** — identifiers in the path, data in the body; never a person in a query string.
- **Prerender** — a person's data is never fetched into a static page; an island asks its door after hydration (skill `use-auth`).
- **Git and documents** — no personal data in code, commits, `development-docs/` or page data. A summary of any work for another agent
  carries no personal data either.

## 4. When the honest answer is «not here»

When a model must reason over identified data and the law forbids it leaving: a model on the owner's own server or an in-country
provider, the feature without AI on that field, or AI on the non-identifying part only. Name the choice to the person early; shipping
«export and hope» is the failure this skill exists to prevent.
