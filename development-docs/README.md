# Development documents of this element

How this element is being built. Written by the element's agent, in English, as the work happens.
The person's own words stay verbatim in quotes, with an English gist next to them.

Two files that describe the element live in the root, not here — programs read them by that path:
- `CLAUDE.md` — the agent's instruction (Claude Code loads it by itself).
- `OWN-SERVICE-PROPS/` — the passport (main door), its A2A card `A2A-CARD.json`; `NODE-CONTRACT.json` — what the node needs.

A native element takes no orders from other nodes (it has no a2a); work it does for its neighbours runs over agreed i2i APIs and
is not development either — none of it is kept here.

**Every document below exists from the element's birth** — `npm run check:dev-docs` fails when one is missing. A new element
is born with two kinds of content here: **useful notes** that hold from day one (`glossary.md`, `anti-patterns.md`) and **empty
forms** of the records (`current-step.md`, `steps-new/`, `steps-done/`, `backlog.md`, `cancelled.md`, `reports/`, …) — never the
history of how the template itself was built.

## Documents

How to use them — what to read when, what to write on which event, how a step is planned and closed — is the skill
`use-development-docs`; two documents have their own skill, named in their row.

| File | What it holds | Who writes | When to open |
|---|---|---|---|
| `current-step.md` | where the work stands: the active step, the last commit, the next action, the person's latest decisions verbatim | the agent, on every event (skill `use-development-docs`) | **on every wake, first** |
| `steps-new/` | plans of steps not started yet: one file `<N>-<words>.md` per step | the agent, after the person agrees to the plan (skill `use-development-docs`) | when choosing what to do next |
| `steps-done/` | summaries of closed steps: what was done, the commit, the proof | the agent, when a step closes (skill `use-development-docs`) | when a task touches an area built before |
| `pre-steps/` | the intake: building requests from outside not started at once (the person mid-step, another agent over A2A, the core's task window); handled ones in `handled/` | the agent, recording the asker's words verbatim — the law is `pre-steps/README.md` | **on every wake, with `current-step.md`**; at the end of every substep |
| `glossary.md` | one meaning per word: the element, the node, the two processes, the protocol i2i of a native element, the passport; the person's words next to each term | the agent, in the same commit that starts using a term in two places | **on wake, before acting on a word that can be read two ways** |
| `anti-patterns.md` | dead ends already paid for: symptom, cause, cure | the agent, when a cause is found (skill `use-development-docs`) | before a build; when something fails |
| `backlog.md` | built but not explained, built halfway, or promised | the agent, the day the gap appears; the line leaves with the commit that closes it | when choosing what to do next; before saying a capability is done |
| `cancelled.md` | what was dropped or rolled back, by whose word, and what replaced it | the agent, the day the person cancels | before rebuilding something that «seems missing» |
| `reports/` | `errors-…` — one failure explained; `feature-…` — one finished capability described (forms in `reports/README.md`) | the agent: an error that took real time; the last step of a capability | when a capability or a failure comes back |
| `proofs/` | one file per proof: how a part of `CLAUDE.md` or a skill was proven live (the method, the runs, the transcript evidence) and what stays unproven | the agent, right after a live proof (rules below, «Proof marks») | before changing a proven section; when deciding what to prove next |
| `owner-decisions-on-skill-changes.md` | what a self-review proposed and what the person answered, verbatim | skill `self-review` | before every self-review |
| `translation-debt.md` | texts left in one language while building: path, what, which languages it owes, why deferred | the agent, the same day a text is left untranslated (skill `use-languages`) | before translating; before launch in more languages |
| `product/` | the product quiz: what the product is, in product words, before code — `quiz.json` and `modules/` (skill `product-quiz`); it appears with the person's first answer, not at birth | the agent with the person; an item is confirmed only by the person's words | on wake into building (`quiz.json` only); before planning a step that serves an item |

## Proof marks

The instruction grows, and every part of it is proven live the way the first proof did (`proofs/2026-10-06-wake-and-a2a-skills.md`):
a real task, the person's own action, and the agent's session transcript showing what it actually ran. Reading the text is not a proof.
The person, verbatim: «иначе мы будем забывать что и когда доказали» (otherwise we forget what was proven and when).

- In `CLAUDE.md` a proven section sits between `<!-- PROOF N START · «<section>» · PROVEN|PARTIAL <date>: <what exactly> · report: <proofs file> -->`
  and `<!-- PROOF N END -->`. PARTIAL names what is proven and what is not. No marks — not proven.
- `N` only grows; a section that changes after its proof loses PROVEN until it is proven again (write PARTIAL or remove the marks
  in the same commit as the change).
- Every proof leaves its file in `proofs/` named `<date>-<what>.md`.
- Skills the same way, to tell working skills from skills under study: right under the header of our own `SKILL.md`
  `<!-- PROOF · PROVEN <date>: <what the live run showed> · report: <proofs file> -->` or `<!-- PROOF · NOT PROVEN yet … -->`;
  the table in `.claude/skills/README.md` has a «Proof» column for every skill, vendored ones too (their files change only by update).

## Rules

- A file in this folder that is not listed above is a defect: `npm run check:dev-docs` fails.
- English only; Cyrillic is allowed only inside quotes «…» or "…" (the person's words).
- Step numbers are this element's own, starting from 1.
