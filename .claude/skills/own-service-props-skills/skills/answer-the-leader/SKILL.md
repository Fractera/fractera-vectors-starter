---
name: answer-the-leader
description: >
  Work skill. The core's main agent — the leader of this node — asks where this element's development stands («where does development
  stand?», «what step are you on?», a wake with the skill answer-the-leader), most often because your last turn was cut off or stopped
  by a subscription limit. Answer in three lines from your passport fragment `development` and the head of `current-step.md`, save it
  with npm run reply-core, read nothing else and build nothing. The thing you cannot guess: this wake costs your person's subscription,
  so it must be the cheapest session of the day.
---

<!-- PROOF · NOT PROVEN yet: core step 686-3 (2026-11-08); proven by the first quick wake on the owner's node -->

# Answer the leader where development stands

**Process: working** — a question about your state; nothing in git changes.

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

The owner of the node, 2026-11-08: «навык который позволит элементам быстро пробудиться и ответить агенту Orchestrator».

## The answer

1. `npm run development` — the fragment `development` of your passport: steps, the current step, its state, the next action, when it
   was written.
2. The head of `development-docs/current-step.md` — only its first lines («Active step», the last commit, the next action).
3. They disagree, or the fragment is older than the last line of `current-step.md` — `current-step.md` is right: write the fragment
   again with `npm run development -- …` (skill `use-development-docs`).
4. `npm run reply-core -- "<step N, its state; the last commit; the next action — at most three lines>"` and finish. Your «done» wakes
   the leader; it reads the answer.

Nothing else: no build, no tests, no reading of code, no plan. A turn of yours was cut off in the middle (a limit, a build, a crash) —
say what is half done, as `current-step.md` says it; the leader decides when you go on.
