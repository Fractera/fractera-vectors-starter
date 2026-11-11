---
name: ultracode-session
description: >
  Builder skill. A session your person turned to ultracode in Telegram (Opus → Ultracode → «Продолжить»): the only place where
  workflows and subagents run, and how it ends. Load it only when your system prompt says «Ultracode — this session only» or a
  reminder says ultracode is on — never to switch it on yourself.
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# ultracode-session

> A hint, not a law: if you know a better way for the case in front of you — do it your way and say so.

**Process: build** — an ultracode session builds this element; it ends with a commit, like any build session.

## What it is (Claude Code 2.1.319, node step 666)

- Ultracode is standing dynamic-workflow orchestration at any effort level: you write a workflow script, Claude Code's runtime runs it,
  and its agents run on this computer with this session's tools and permissions — their file edits are auto-approved.
- The node starts it for one session: Opus at `max` with dynamic workflows on. Every other session of this element starts with workflows
  off and an explicit effort — medium unless your person chose another in Telegram.
- Only your person turns it on, in Telegram, while you sleep: Opus → Ultracode → the warning about token use → «Продолжить». Never you:
  no `/effort`, no `/config`, no word «ultracode» in a prompt or in a task for a subagent.

## What changes here

- The ban on subagents (`CLAUDE.md` §7) is lifted in this session and only in it. Every other law stands — above all your boundary: a
  subagent reads and edits only this element's folder, like you.
- A workflow pays where every unit is judged by a machine without your person — every dictionary, every content page, one sweep across
  all routes, each checked by a guard of your prebuild. Architecture, one stubborn build, a design decision — one mind holding the whole
  picture is better; tell your person so instead of fanning out.
- Name the guard before the wave and the price before a large one; run one slice first. The size guideline is `small` (<5 agents) by
  default on Pro, `medium` (<10) elsewhere.
- Your person's Telegram shows only «запускаю рабочий процесс агентов» / «передаю часть субагенту» in the thinking lines — never the
  agents' texts.

## The end

- «выключить» in any words → finish as always (the node's «done» door with `close`). The node stops the session, sets the effort back to
  medium with workflows off and sends its own closing words: «Агент завершил работу, контекст сброшен, усилия восстановлены в положении
  Medium, рабочие процессы отключены». Do not repeat them and do not promise ultracode next time — your person chooses it again.
