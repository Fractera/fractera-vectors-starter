---
name: use-development-docs
description: >
  Builder skill. Load it only when a building step is bigger than one change: a plan with more than one result, a step or
  substep that closes, a new task arriving in the middle of a step, the context running out, or before you create any file or
  folder to track work. A small task (one door, one fix) goes the short way of «Steps» 2a without it. How building this
  Fractera element is carried in its development documents (`development-docs/`) so that no work is lost when the session
  ends — planned or sudden (power, a crash, a closed terminal).
  The thing you cannot guess: the next session knows only what `development-docs/current-step.md`
  says — a commit tells what changed, never what was decided, what is half done or what comes next.
---

<!-- PROOF · PARTIAL 2026-10-07: loaded first after «yes», current-step.md kept on events; no plan in steps-new/; the pre-steps intake (added 2026-10-07) and glossary, backlog, cancelled, reports (added 2026-10-08, step 435-5) and the `Serves:` line (added 2026-10-18, node step 536-2) NOT proven · report: development-docs/proofs/2026-10-07-node-skills.md -->

# use-development-docs

> A hint, not a law: if you know a better way for the case in front of you — do it your way and say so. The freedom is in HOW

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).
> you build; whether the work is carried in these documents is not optional.

What each file holds, who writes it and when it is opened — `development-docs/README.md`; this skill is how to use them.
Everything here is English; the person's own words stay verbatim in quotes «…» with an English gist next to them
(`npm run check:dev-docs` refuses Cyrillic outside quotes and any file the README does not list).

## On wake into building

1. Read `current-step.md` whole — first, before code. It says where the work stands, what the person decided and what comes next.
   Then `pre-steps/` — a non-empty intake is named to the person before you choose what to do.
2. An active step → its plan in `steps-new/`. The task touches an area built before → the matching files in `steps-done/`.
3. Something fails → `anti-patterns.md`: the dead end may already be paid for.
4. A word of the person or a term that can be read two ways → `glossary.md` before acting on it. Something «seems missing» →
   `cancelled.md` before rebuilding it: it may have been dropped on purpose. Choosing what to do next → `backlog.md` too.

## `current-step.md` — written on events, not at the end

Its job is to survive ANY interruption. Ask yourself: «if the session ends right now, what from the last half hour would be
lost?» — and write that now. Update it when:

- the person takes a decision — verbatim, at once;
- you learn something expensive (a measured fact, a cause found);
- you commit — the hash, at once;
- you find a defect on the way — one line;
- a long or irreversible operation is about to start — BEFORE it;
- the next action changes.

Rewrite it over, do not append a diary: the active step, the last commit, the next action, the queue, the person's latest
decisions. History lives in `steps-done/` and git. Nothing to do → «Active step: none» and the last change.

Near the end of the context: write `current-step.md`, then tell the person that the session should be restarted — a new one
reads the file first. Do not rely on automatic compaction: what it drops, nobody sees.

## A step

Every building task is a step, even a five-line fix. The number is the next one after the highest in `steps-new/` and
`steps-done/` and never reused.

- **Small** (one result, one place — one door, one fix): the plan is the three lines of «Confirm the request first» in
  `CLAUDE.md`; after the person's «yes» write the step into `current-step.md`, build, close with a short `steps-done/<N>.md` and
  `current-step.md` in one commit. No `steps-new`, no quiz modules, and the notes of «Closing» below are opened only when
  something broke or is left undone (owner of the node, 2026-10-20: building must cost less).
- **Larger** (more than one result or place): a plan `steps-new/<N>-<six to eight words>.md` — what is asked, in the person's
  words; what already exists and is reused; the limits it must not break; the observable results; substeps 2–10, **one
  observable result each, never by layers** («all doors, then all UI»); the checks of each, named before the work (skill
  `use-tests-before-dev-finish`). Show the substeps to the person, one line each, and start only after their «yes».
- A substep closes with a commit, and its hash goes into `current-step.md` at once. A summary without a commit hash is an
  unclosed substep.
- The work turns out bigger or different from the agreed plan — stop and ask before doing it; the «yes» covered the plan.
- **One line `Serves:`** (node step 536-2) in the plan, in every summary in `steps-done/`, and in `current-step.md` while a small
  step is active: the numbers of the product quiz items the step serves (`development-docs/product/`), for example
  `Serves: S-03, R-02`, or `Serves: none`. The core reads only this line to show, next to each item of the quiz, which steps work
  on it and in what state (planned · in progress · done). The quiz itself keeps no list of steps: a second list would drift.

## A task in the middle of a step

Two questions: does it change a file, and does it serve the same capability as the active step? Same capability → a new
substep of this step (after the person's «yes»). Otherwise → a request file in `pre-steps/` (the law and the form are in
`pre-steps/README.md`), named to the person; it becomes a step after the current one closes or when the person says. The same
for a building request from another agent over A2A or from the core's task window that you cannot start now.
One exception: the person's decision that changes a rule of `CLAUDE.md` or a skill is applied at once.

## Closing

- `steps-done/<N>.md` (and `<N>-<k>.md` per substep of a larger step): what was done and how, the commits, the evidence of
  each planned check, what is not checked and why, the mistakes, what a skill lacked. The plan file leaves `steps-new/` in the
  same commit.
- A closed step that gets a new substep is closed again as a whole — no «addendum» files.
- A cause found the hard way → `anti-patterns.md`: symptom, cause, cure. A live proof of a part of `CLAUDE.md` or a skill →
  `proofs/` and its mark (README, «Proof marks»). A text left in one language → `translation-debt.md` (skill `use-languages`).
- Left undone or promised → a line in `backlog.md`; the line leaves with the commit that closes the gap. The person cancelled
  or rolled back something → `cancelled.md` with their words and what replaced it. A term now used in two places →
  `glossary.md` in the same commit. The last step of a capability → `reports/feature-…`; an error that took real time →
  `reports/errors-…` (forms in `reports/README.md`).
- `current-step.md`: «Active step: none» or the next one, the last commit, the next action.

## Notes and records — what a new element is born with

Two kinds of content live here. **Useful notes** (`glossary.md`, `anti-patterns.md`) hold from the first day and travel to every
element born from this one. **Records** (`current-step.md`, `steps-new/`, `steps-done/`, `backlog.md`, `cancelled.md`,
`reports/`, `pre-steps/`, `translation-debt.md`) are about this element's own building: a new element gets them as empty forms,
never with the history of the element it was born from. No document of the set is ever deleted because it is empty — an empty
form is how the next agent knows where to write (`npm run check:dev-docs` fails when one is missing).

## Do not

- Create your own folder or file to track work (`tasks/`, `plans/`, `TODO.md`) — one system of records only; a new kind of
  document is the person's decision, and it gets its line in the README.
- Keep the state in your head until the end of the work.
- Write a worker job (an order) here.
