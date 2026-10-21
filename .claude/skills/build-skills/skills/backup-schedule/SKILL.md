---
name: backup-schedule
description: Both natures. Backup of this memory element — the copying service is code (build), its schedule is data (work). Load when the core sends a task from «Backup → Settings», when your person asks to copy, restore or reschedule copies of this element's data, or asks where the copies go.
---

<!-- PROOF · NOT PROVEN yet: written 2026-10-21 (node step 558-2); the clock is proven by its guard run, the skill by no live agent run yet -->

# Backup schedule

**Process: both** — the copying service and its event are build (code, commit, «Preview & Deploy»); the schedule entry is work
(a record in `data/cron.json`, no commit, no rebuild). Name the process on the first line of your answer, as always.

A hint, not a law: models of late 2026 work worse under rigid step-by-step instructions.

## Where things live
- **The clock** — `lib/cron/runner.ts`: the element's own server checks `data/cron.json` once a minute (owner of the node,
  2026-10-21, step 558: backup timers ordered for the four memory elements). No new process; a run missed while the computer is off is
  not caught up. `automation.cron: false` in the passport stops every entry.
- **What can run** — `OWN-SERVICE-PROPS/CRON.json` → `events` (code). A new kind of copy = `lib/cron/events/<id>.ts` + a line in
  `EVENTS` of `runner.ts` + an entry in `events`. `telegram-message` is built in: it sends the entry's `message` to your person.
- **When it runs** — `data/cron.json` (outside git): `{ "repeatsPaused": false, "schedules": [{ "id", "event", "name"?, "message"?,
  "time": "HH:MM", "repeat": "once|daily|weekdays|weekly|monthly", "start": "YYYY-MM-DD", "until"?, "enabled": true }] }` (type
  `CronSchedule` in `lib/cron/due.ts`; local time of the computer). The core draws it as the calendar
  in «Backup → Cron events»; the journal is `data/cron-runs.jsonl`.
- **Where copies go** — outside services in `OWN-SERVICE-PROPS/SUBSCRIPTIONS.json` (`services[]`: id, name, description, docs, keys by
  variable name only, check door). The core shows them in «Backup → Tools». Keys live in `.env.local`, never in git.

## The usual task
The person's words from «Backup → Settings» say what to copy, how often and where. Build the copying event, add its service to
`SUBSCRIPTIONS.json`, ask for the keys by variable name, commit, deploy — then write the schedule entry and say when the first copy
runs. Copy only this element's own data (`SERVICE_DATA_DIR`, its database or folder); never another element's.

## Never
- Personal data or keys in git — an entry's text lives only in `data/cron.json`.
- A copy that blocks the server: stream large files, never read a whole database into memory on this small machine.
- A schedule more often than the person asked; no retries on failure — the journal shows the error and the person decides.
