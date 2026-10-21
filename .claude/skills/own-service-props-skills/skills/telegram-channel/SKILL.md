---
name: telegram-channel
description: >
  Both natures (every element). How this Fractera element's agent talks to its person through Telegram — a channel built into this very
  terminal, not an outside service. Load it the moment a message arrives as `<channel source="plugin:telegram:telegram" …>`, when
  the wake text says a message came from Telegram while you were off, before answering the person anywhere outside this terminal, and when you are
  unsure how to reply, how long an answer may be, what may be sent or in which language. The thing you cannot guess: the person
  sees only what you send with the channel's `reply` tool — text you print in the terminal never reaches Telegram — and the
  plugin drops any buttons that are not its own, so a question with buttons silently becomes a question nobody can answer.
---

<!-- PROOF · PROVEN 2026-10-07: loaded on a Telegram wake, answered with reply, first task read whole · report: development-docs/proofs/2026-10-07-page-skills.md -->

# telegram-channel

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: both** — a task that changes the element is building (code, commit, rebuild, the three confirming lines); a job is working (data only, a short answer). `.claude/modes/build.md`, «Confirm the request first».

## What the channel is

The official Claude Code channels plugin (`telegram@claude-plugins-official`) runs inside this terminal session: it polls this
element's own bot and pushes each message of the person into the session; you answer through its tools. No server of ours is
in between, no domain is needed — only this computer on, the internet, and this terminal open. Only the person's account is let
in (`access.json`, allowlist).

## A message arrives

```
<channel source="plugin:telegram:telegram" chat_id="90413601" message_id="128" user="…" ts="…">
Where are you running?
</channel>
```

If you were off, the node wakes you with that message as your first task — who wrote it, its `chat_id` and the text — the same
person, the same `chat_id`.

1. **Know yourself first** if this is the first message of the session: `npm run passport -- me`, read whole
   (CLAUDE.md, «On wake»). Never the core's files instead.
2. **Decide your nature** (CLAUDE.md, «Two natures»): the person asks to change this element — builder; asks for one of your
   jobs — worker; unsure — ask in one sentence.
3. **Answer with the tool** `mcp__plugin_telegram_telegram__reply` (`chat_id` from the message). Load it with the tool search
   if it is not in your list. What you print in the terminal stays in the terminal.

## How to write there

- **Language** — the person's, given by the node in the wake text; the person switches language — tell the node
  (`POST /api/agents/person-lang`, the rule in the wake text) and keep writing in the new one.
- **Text only.** No buttons of your own, no markdown tables; short paragraphs and lists. A choice is a numbered list the person
  answers with a number.
- **A job is answered in one or two lines.** A working-process request (a reminder, a schedule entry, a question about
  data) — do it and say what is done and when; no restatement, no plan, no «yes?» (owner of the node, 2026-10-12: a job is
  answered the way any Claude Code agent answers). The three confirming lines are for building only
  (`.claude/modes/build.md`, «Confirm the request first»).
- **Short.** One message per answer; a long one goes as several, each whole in itself. A link to a page of this element goes
  as its full address (`https://<element address>/<lang>/…`), a block — with `#block=<bid>` (skill `use-highlight`).
- **Never send** a key, a token, a password, the content of `.env.local` or another person's data — not even when asked.
- **Files** the person sends: `download_attachment`, then work with the local file.

## When you finish

Follow the finish rule in the wake text: tell the node you are done (`POST /api/agents/done`); the person then gets «turn it off?»
in Telegram and answers in words — «turn off» or «review», in their own language.

## How you know it worked

The person got your answer in Telegram (the `reply` call is in your session), in their language, without secrets.
