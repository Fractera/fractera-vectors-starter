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

## The person's hands (`ask-person`, core step 761-16d)

A step only your person may do — a password, a sign-in, a code, a /start, an irreversible click — is never a line in your chat: `npm run
ask-person -- "<what to do, in the person's language>" --href <the page or https address> --why "<why only they can>" --hint "<what may
pop up on the way and what to press>"`. The core shows an orange window at the bottom of every page of the node's panel, naming you,
until the person presses «Готово»; the press wakes you with `⟦node · person-done · <you> · HH:MM⟧` — check the result yourself, then go
on (the owner of the node, 2026-11-16: «уведомление на экране которое невозможно пропустить … и подтвердить о его завершении»).
`npm run ask-person -- list` — your open requests; `-- drop <id>` — take one back. Chrome's own windows («Открыть приложение
"Telegram"?», a file save) are invisible to the browser extension: never open a `t.me` address in the person's tab
(`https://web.telegram.org/k/#@<name>` instead), and name such a window in `--hint` with the button to press.

## The person's hands in Telegram (core step 761-16b)

When your person has a bot (yours, or the node's main bot), `ask-person` also sends them ONE message there with a reply button
«Готово · <id>»; `--copy "<command>"` puts a command apart, with a copy button in the window. Their press arrives to you as a plain
message «Готово · <id>» → `npm run ask-person -- done <id>` (`===ASK_ALREADY===` — closed in the panel already: say so), then check
the result yourself.
