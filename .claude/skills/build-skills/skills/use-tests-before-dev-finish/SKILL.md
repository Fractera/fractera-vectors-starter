---
name: use-tests-before-dev-finish
description: >
  Builder skill. Load it only when a building step is bigger than one change, before its «done», «ready», «it works»; when a
  check gives an unexpected answer; and when the person asks «did you test it?». A small task (one door, one fix) proves itself
  with the checks named in its three confirming lines («Plan the checks before the work») without this skill. How you prove
  that a change to this Fractera element works before you say «done» — the checks you plan before building, the two kinds of
  evidence every change needs, the spoil-and-restore control, the measurements that lie on this node, and what to say when a
  check cannot be run. Not for a worker job (an order for another agent) — that is checked by its own skill. The thing
  you cannot guess: a green build looks the same whether the feature works or not, and on this computer the owner passes every
  lock — a page that answers 200 to you may answer 401 to a visitor.
---

<!-- PROOF · PARTIAL 2026-10-07: the law kept (planned checks, spoils), the skill never loaded · report: development-docs/proofs/2026-10-07-node-skills.md -->

# use-tests-before-dev-finish

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## Plan first

The checks are named in your confirming message before the work (`.claude/modes/build.md`, «Plan the checks before the work») and agreed
with the person. After the work you run exactly those — a check picked afterwards proves what was easy.

## Two kinds of evidence, both

| Kind | What | Examples |
|---|---|---|
| **the machine** | the guards and the types | `npm run prebuild` — the **whole** chain, not one guard; `npx tsc --noEmit -p .` |
| **the behaviour** | what a visitor or the person gets | a live request with its answer; the page's HTML has the new `data-block`; a door answers the right code |

A build log is never the second kind: it reads the same whether the feature works or not.

## The control: spoil, see red, restore

For a rule you rely on (a guard, a lock, a fallback), break its input on purpose, see it refuse, put it back, see it pass, and
check `git status` is clean. A guard that stays green on a spoil watches nothing.

## Measurements that lie here

- **You are the owner at this machine:** `localhost` passes every lock as the architect. A lock is checked also as a stranger,
  through the public address (via Cloudflare it is not the owner): a door by `curl` without a session → 401/403; a page only in a
  private browser window — its HTML answers 200 to everyone (skill `use-auth`). No public address — say the check is not possible.
- **Page cache:** after `npm run pages:refresh` the first visit may still get the old page; request twice. On the own domain
  public pages come from the Cloudflare copy until «Deploy» or «Update copies» — a `curl` there proves the copy, not your change.
- **Code is in the build, data is live:** a code change is seen only in a new build (Preview before deploy); the live site
  still runs the old one (skill `deploy-element`).
- **`… | tail`** prints `tail`'s exit code: keep the command's own code (`; echo $?` right after it).
- **`localhost` vs `127.0.0.1`:** the core listens on `localhost` (IPv6 on Windows); a preview answers only on `127.0.0.1`.

## What you cannot check

A microphone, a click in the person's browser, an email that arrives — say plainly «not checked: …, check it this way: …».
Never replace it with an easier check and call it done.

## Then report

CLAUDE.md, «How you report», and `.claude/modes/build.md`, «Report what a person can see»: each check, its line, what was not checked, and the links with `#block=`.
