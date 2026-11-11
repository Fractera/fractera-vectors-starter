---
name: schedule-cron-automations-calendar-reminders-recurring-and-one-time-tasks
description: >
  Work skill — an entry is data, never code. Reminders, schedules and cron automations — once or repeating, paused, off, on —
  and what to do when your alarm wakes you. Load it when the person asks to remind, schedule, repeat or stop reminders («напомни»,
  «каждое утро», «по будням», «выключи напоминания», «что у меня завтра»), when your alarm fires, when a build needs a clock, and when
  you touch `data/cron.json` or `lib/cron/`.
---

<!-- PROOF · NOT PROVEN · written 2026-10-12, rewritten in node step 465-4, the automation switch added in node step 551-3, the alarm, the yearly repeat and the group of every mode in node step 636, `node-notice` in 636-8; proven only when the agent of this element has done it on the person's word -->

# schedule-cron-automations-calendar-reminders-recurring-and-one-time-tasks

> A hint, not a law. If you know a better way for the case in front of you, do it and say so.

**Process: working** — the running element does its job; only data changes. Owner of the node, 2026-10-12: «автоматизация рабочего
процесса не должна приводить к сборке проекта … Только строительный процесс должен приводить к сборке»; «в рабочих процессах пусть
существует стандартный процесс ответа Claude Code Agent». ✗ Paid for: on «remind me about a birthday» an agent wrote an event
in code, committed it, asked for a rebuild, and «tested» it by sending the real «tomorrow is the birthday» a month early.

## Your calendar is your own (owner of the node, 2026-11-03)

«каждый элемент имеет право способен жить своей собственной жизнью вставить свои собственные задания отправлять уведомления через своего
Telegram бота если существует если не существует то через тебя» — two ways an entry comes, both yours to write, no permission needed:
1. **Your own life.** Your person asks you directly (your bot, your terminal), or your own job needs a time («every night at 3 —
   back up the data»): you put the entry yourself; the core's main agent is not asked.
2. **The orchestrator's task.** The core's main agent gives you a task with a time (`npm run task`): the same entry.
At its minute a `node-notice` puts the words into the node's main chat, and — if you have your own bot — into your bot too: the person
gets two messages for now («Пусть будет пока так», the owner). An `agent-task` wakes you; words the work ends with go to the main chat
through `npm run tell-core -- --alarm`.

## Who does what (owner of the node, 2026-10-20)

| What | Who | Where |
|---|---|---|
| turn the whole automation on or off | the person — the switch «Use automation» on this element's calendar page in the core — or you on the person's word | the passport field `automation.cron` |
| add, change, pause, cancel an entry | you, on the person's word | `data/cron.json` through `npm run calendar` |
| a new kind of event (code) | you, as building (section «When it is not a reminder») | `lib/cron/events/`, `OWN-SERVICE-PROPS/CRON.json` |

The calendar page: a custom element — «Working process → Process → Cron automations»; a native element — «Cron events» (data,
storage, vectors and graph — «Backup → Cron events»).

## Files and processes

| File | In git? | What | Who changes it |
|---|---|---|---|
| `data/cron.json` | **no** | the person's schedule: `schedules`, `repeatsPaused` | **you, in the working process** — this is all a reminder needs |
| `OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json`, field `automation` | yes | `{ "cron": true \| false }` — the whole automation on or off | **the working process although the file is in git**: change only this field, no commit, no rebuild; the core shows the file uncommitted until your next build commit |
| `OWN-SERVICE-PROPS/CRON.json` | yes | the catalog of events (what the element CAN run) and `seed` (the example a new element starts with) | only the build process |
| `lib/cron/` | yes | the clock (once a minute) and the event handlers | only the build process |

The server reads `data/cron.json` and the switch every minute — a change is live within a minute. While `automation.cron` is `false`
nothing runs, whatever the entries say. Times are the **local time of the computer**.
While the computer is off or the element is stopped, a run is skipped and **not made up later** (the calendar shows «skipped»).

## A reminder = one entry

**Every change goes through `npm run calendar`** (core step 699) — `add`, `pause <id>`, `resume <id>`, `cancel <id>`, `repeats
off|on`, `list`. It stamps `saidAt` with the moment of the change, checks the event against your catalog and the times, and writes the
file whole; never edit `data/cron.json` by hand (the owner of the node, 2026-11-08: a hand-written `saidAt` at midnight made the core's
canvas call an entry «missed» before it existed). The entry it writes:

```json
{
  "id": "call-mum-2026-10-13",
  "event": "node-notice",
  "name": "Call mum",
  "message": "Позвонить маме.",
  "saidAt": "2026-10-12T18:40:00.000Z",
  "time": "09:00",
  "repeat": "once",
  "start": "2026-10-13",
  "enabled": true
}
```

- Three built-in events, none needs new code (owner of the node, 2026-11-03: «события крон должны приходить не затрагивая
  искусственный интеллект независимо от происходящих процессов оно просто должно всплыть по расписанию и всё»):
  - `node-notice` — **any reminder for the person**: at that minute the core's notice door puts `message` into the node's main chat,
    «⏰ Reminder · <this element>» and the words as a quote — and your own bot sends it too when you have one. No model, no agent woken.
  - `telegram-message` — your own Telegram bot sends `message` as written: only when the person talks to you in your own bot and
    asked there.
  - `agent-task` — at that minute your clock wakes **you** with the entry's words («Your alarm fired — …»): only for work that needs
    you at that time — a check, a copy, a report. It costs a session; words for the person are never this event.
- Write `name` and `message` in the **element's default language** (`npm run passport -- me` → `languages.default`), as the reminder
  itself («Завтра день рождения друга.» for `ru`): every entry of the calendar is in that language (owner of the node, 2026-10-20).
- `saidAt` — the moment of the change, stamped by `npm run calendar`: the calendar shows it next to the time it is due and never
  calls a moment before it «missed».
- `time` — `HH:MM`, 24 hours. `repeat` — `once` (on `start` only) · `daily` · `weekdays` (Mon–Fri) · `weekly` (the weekday of
  `start`) · `monthly` (the day of month of `start`) · `yearly` (the day and month of `start`). `start` — `YYYY-MM-DD`; `until` —
  optional last day.
- «In a week», «tomorrow», «on the 10th» — you count the date from today's date on this computer (`date`), and the answer names it in
  words («во вторник, 10 ноября, в 9:00»): the person catches a wrong date there.
- `enabled: false` — paused. `repeatsPaused: true` (top of the file) — **all repeating** entries off, `once` ones still run.
- `id` — short, unique, never reused: the run log points at it.

## What the person says → what you do → what you answer

| The person | You (`npm run calendar -- …`) | Your answer — one or two lines |
|---|---|---|
| «remind me tomorrow at 9 to call mum» | `add --event node-notice --name … --message … --time 09:00 --repeat once --start <tomorrow>` | «Готово: завтра, 13 октября, в 9:00 напомню позвонить маме.» |
| «on weekdays at 9:30 …» | `repeat: weekdays` | «Готово: по будням в 9:30 — …» |
| «every Monday at 9:30» | `repeat: weekly`, `start` = next Monday | «Готово: по понедельникам в 9:30, начиная с 19 октября.» |
| «every year on 10 March — mum's birthday» | `repeat: yearly`, `start` = the next 10 March | «Готово: каждый год 10 марта в 9:00 напомню о дне рождения мамы.» |
| «pause the Monday reminder» | `pause <id>` | «Поставил на паузу.» |
| «turn off all repeating reminders» / «back on» | `repeats off` / `repeats on` | «Все повторяющиеся выключены; разовые сработают.» |
| «turn off the automation» / «turn it on» | passport `automation.cron: false` / `true` (only this field) | «Автоматизация выключена: ничего не выполняется, записи сохранены.» |
| «delete it» | `cancel <id>` | «Удалил.» |
| «what do I have on Friday?» | `list` — read, change nothing | the times and texts, nothing else |

No restatement, no plan, no «yes?», no commit, no push, no rebuild, no «check the calendar» lecture. Ask one short question only
when the request is truly ambiguous — which date («on the 10th» of which month?), which time («in the morning» → offer 9:00).
In Telegram — plain text. Mention the computer-off risk once, only for something that must not be missed (a birthday, a payment).

## When your alarm wakes you (`agent-task`)

Your input opens with «Your alarm fired — the calendar entry «…»» and the entry's words (node step 636).
1. Do the work the entry names (a check, a copy, a report) as it says, and nothing more.
2. The work ends with words the person must hear now → `npm run tell-core -- --alarm "<the words, in the person's language, as they
   are>"`; the core's main agent passes them on. A plain reminder never comes here — it is `node-notice`.
3. Never another agent's bot or door, never a neighbour woken by you for it: only agents talk to agents (`CLAUDE.md`, section 7).
4. Then finish as usual. A `once` entry stays in the calendar as done; nothing to delete.

## Checking without sending

Do **not** run a handler or send a test message to «prove» a reminder: the person reads it as the real one. Check the data instead:
the file parses, the entry has the right `start`/`time`/`repeat`. The built-in events are proven once for the element; a test send
happens only when the person asks for it, and its text starts with «Проверка напоминания: …».

## When it is not a reminder — the build process

A new **ability** (call an outside service, build a report, post somewhere other than Telegram) is code: a handler in
`lib/cron/events/<id>.ts`, a line in `EVENTS` of `lib/cron/runner.ts`, an entry in `events` of `OWN-SERVICE-PROPS/CRON.json`, then
a rebuild (`deploy-element`). That is building: say so in one line and switch to the three confirming lines of `CLAUDE.md`. A new
**text** is never building.

## What it cannot do

Make up runs missed while the computer was off · run anything while the element's server is stopped · wake an agent while the
computer has too little free memory for a session (the run log says so, the calendar shows the error) · let the person edit the
calendar with the mouse — only through you.

## Proof of a run

`data/cron-runs.jsonl` — one line per run: `slot` (`YYYY-MM-DDTHH:MM`, local), `at`, `schedule`, `event`, `ok`, `detail`.
