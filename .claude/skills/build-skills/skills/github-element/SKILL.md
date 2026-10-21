---
name: github-element
description: >
  Builder skill. How this Fractera element's work is saved to its own GitHub repository — when you send it, with which command,
  what the answers mean and what only the person can do. Load it whenever you finish a task that came through Telegram, whenever
  the person says "push", "send to GitHub", "save it", "is it on GitHub", "the repository", and when a push fails. The thing you
  cannot guess: a commit lives only on this computer until it is sent; the node's own `git push` is not the way — the core sends
  with the key the person gave it, and a task from Telegram is sent at once while a task typed in the terminal is sent only on
  request.
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# github-element

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## What the repository is

This element has its own repository (its GitHub page in the core shows which). It is the copy of the work that survives this
computer: a new node is restored by cloning the person's repositories. A commit not sent exists only here.

## When you send

| The task came | Send |
|---|---|
| through Telegram | **at once**, after the commit — the person is not at the computer to press a button |
| typed in this terminal | **only when the person asks** («send», «push», «save to GitHub») — commit as usual |
| a test or a check the person called that | never — they said so |

## How

```
node "<node>/scripts/element-github-push.mjs" <element id>
```

The exact path and id are in the GitHub rule of your launch prompt. It asks the core, which commits any rest and pushes with the
key — never `git push` yourself, and never a token in a command. Tell the person the line it printed:

| Line | Tell the person |
|---|---|
| `===GITHUB_PUSH_OK===` | sent — and how many commits went (everything not sent before goes too) |
| `not-connected` | no repository or key yet — they add the key on the node's GitHub page, then «Create and upload» on this element |
| `no-write` · `needs-workflow` · `auth-failed` | the key cannot do it — a classic token with `repo` and `workflow` (this element carries `.github/workflows`) |
| `rejected` | the repository has other history — ask them what to keep; never force |
| `temporary-address` | the core refused through its temporary address — run it on this computer |

## What only the person does

Give the key, create the repository («Create and upload»), import or rename it, update from Fractera's template («Update»). You
point them to the element's GitHub page — you never handle a token and never change the remote.

## How you know it worked

`===GITHUB_PUSH_OK===`, and the element's GitHub page shows the last commit as sent.
