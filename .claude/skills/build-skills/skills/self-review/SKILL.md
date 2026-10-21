---
name: self-review
description: Builder skill. A review of your own work at the person's request — find in your session where you stumbled and propose at most three changes to your skills, checked against the log of earlier decisions. Load it ONLY when the person asked for a review (the word «review» — in their own language, e.g. «разбор» — in the terminal or in this element's Telegram). Never without that request.
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# self-review

> A hint, not a law: if you know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

Result: the person got from 0 to 3 proposals, each resting on something that happened in this session; their answer to each is
written into `development-docs/owner-decisions-on-skill-changes.md` word for word; what was accepted is applied and committed.
Nothing is changed without their «yes».

## Where to look

`npm run review:digest` — a digest of your last session: which skills were loaded, where a command failed and what came next,
which commands repeated, what the person told you. Do not read the raw session file — it is hundreds of kilobytes; the digest is
enough. Then the skills from its «Skills» line (their `SKILL.md`) and `development-docs/owner-decisions-on-skill-changes.md`.

## What counts as a reason

- a command failed and you later found a way round it — the skill could have named the right way at once;
- you searched the code for something the skill could have named by path;
- the person corrected you — their words are in the digest;
- the same thing was done several times.

No reason at all — say so: «nothing to improve». Do not invent a proposal for the sake of a proposal.

## How to propose

- **At most three**, numbered. Each has: the reason (a line from the digest), which skill, which line changes and into what.
- **A proposal names the process** of the skill it touches — build or working (`.claude/modes/build.md`, «Skills of the build session»: «A skill starts with its process and its group»); a new skill or a
  rewritten one keeps its `Builder skill` / `Work skill` / `Both natures` mark and its `**Process: …**` line (owner of the node,
  2026-10-12); `npm run check:skill-process` must stay green.
- **Replacing a line beats adding a paragraph.** A skill is a vision, not a step-by-step plan: a long skill works worse.
- **Already decided — do not propose.** A proposal that `development-docs/owner-decisions-on-skill-changes.md` shows as rejected
  is not repeated; if the reason is new and weighty — name the earlier refusal and ask whether something has changed.
- **Not about this element** (the node's core, the agent kit, the template, a neighbour) — do not fix it here: put it into the
  node's inbox `POST http://localhost:<core port>/api/node/review-inbox` (node key `X-Node-Key` = `SETTINGS_SECRET` from
  `.env.local`, body as a UTF-8 file: `{ "from": "<element id>", "where": "<core | agent kit | template | neighbour …>",
  "signal": "<digest line>", "proposal": "<what to change>" }`; the core port — from the address in the «tell the node» line of
  your task or the core's `logs/runtime.json`) and tell the person: «this is not mine — passed to the node's inbox». Decisions on
  such findings are not written into `development-docs/owner-decisions-on-skill-changes.md`.
- To the person — in their language, briefly: what happened, what to change, what it gives.

## After the answer

1. In `development-docs/owner-decisions-on-skill-changes.md` — a line per proposal: date · reason · proposal · the person's
   answer **word for word** · the commit, if accepted.
2. What was accepted — apply to the skill, `git commit` (the skill and the decisions file in one commit).
3. What was rejected — only the record, the skill stays as it is.

## 🛑 Never

- Change a skill, `CLAUDE.md` or code without the person's «yes» to that specific proposal.
- Start a review without a request, run subagents or trial runs of a skill.
- Delete or rewrite earlier records of `development-docs/owner-decisions-on-skill-changes.md`.
