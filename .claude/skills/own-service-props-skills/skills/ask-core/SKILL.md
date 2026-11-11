---
name: ask-core
description: >
  Both natures. The core's main agent as your link: ask how the node works (a core door, the deploy, the node key, a neighbour's
  contract) when your files, `.claude/node-knowledge/`, `npm run passport -- me` and skills do not say; save a check it gave you
  with npm run reply-core; send words for the architect, an alarm first, with npm run tell-core. A question costs the subscription
  — the last resort.
---

<!-- PROOF · NOT PROVEN yet in full: the question and the answer proven live 2026-10-20 (node step 548-19); the way back (548-20) — by its live round -->

# Ask the core, answer it, tell the architect through it

**Process: both** — a question or an answer changes nothing in git; what you do with the result follows the task you are in.

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

## Asking

1. Your own first: the files of this folder, `npm run passport -- me` (its part `node`), the skill of the area. Still unclear how
   the node does it → ask.
2. `npm run ask-core -- "<one question in English, with the words of the area>"` wakes the core's main agent (if it has a Telegram
   bot, your person is asked first) and prints whether the question went.
3. Meanwhile do not guess and do not read the core's files: go on with what does not depend on the answer, or tell your person
   you are waiting for the core.
4. The answer comes into your input as «Answer from the core to «<your question>»: …» — an answer, not a new task: continue the
   work that needed it. In a session that did not ask (a fresh one), tell your person the answer in two lines and stop.
5. «The core does not know» — ask your person; the architect decides.

## The way back

A task from the core's main agent that asks you to check or find out something (not to build) is a job: the first line «Working
process», no commit. Do it, print the result here, save it with `npm run reply-core -- "<the result in a few lines>"` and finish as
usual. The main agent leads you for this check, so your «done» wakes it with no question to your person; it reads the result and
tells the architect, then turns you off. Only what you found; a guess is named as a guess.

## Telling the architect (`tell-core`)

Words for the person that the person is not reading from you right now — first of all your alarm («Your alarm fired — …», skill
`schedule-cron-automations-calendar-reminders-recurring-and-one-time-tasks`): `npm run tell-core -- --alarm "<the words, in the person's
language>"`. The core's main agent tells the architect where they read it, naming you; `===TELL_CORE_OK===` — done. Without `--alarm`
(your own initiative, rare) the node first asks the person whether to turn the main agent on. Never another agent's bot or door:
only agents talk to agents (`CLAUDE.md`, section 7).
