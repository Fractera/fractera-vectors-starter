---
name: use-messenger
description: >
  Builder skill, the gatekeeper of the vendored `ai-elements`. Load it when a task touches a messenger or a chat window — the
  branches `messenger-h2h` and `messenger-h2a`, the buttons «H2H Messenger» and «H2A Messenger», `components/messenger/`, a
  message list, a prompt input («мессенджер», «чат», «переписка») — and before adding any chat UI anywhere.
---

<!-- PROOF · PROVEN 2026-10-12 · report: development-docs/proofs/2026-10-12-six-skills.md (in roman) -->

# use-messenger

> A hint, not a law. If you know a better way for the case in front of you, do it and say so — except the rule marked 🔒.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## 🔒 The rule (owner, 2026-10-12, verbatim)
«В навыки и в readme жёстко требовать ограничения на использование в дизайне ui/ux только библиотеке ai-elements».

- Every visible part of a messenger — conversation, message, prompt input, attachments, tool calls, reasoning — is an ai-elements
  component from `components/ai-elements/`. A missing one: `npx ai-elements@latest add <name>` (then the skill `ai-elements`, its
  `references/<name>.md`).
- No own chat primitives, no hand-made bubbles, no other chat library. Layout around the window (a page frame) is the element's
  typography and sections as everywhere else.

## Where things are
| Piece | Path |
|---|---|
| shared window | `components/messenger/messenger-shell.client.tsx` + words `messenger.i18n.ts` |
| H2A branch | `app/[lang]/(protectedLayer)/messenger-h2a/` — list `/<lang>/messenger-h2a`, conversation `/<lang>/messenger-h2a/<id>` |
| entry | `lib/menu/account-links.ts` — the button above «The architect group of pages», role `architect` only |

Every folder carries a README; read the branch README first.

## What is not built (say it, never pretend)
Sending, storing and loading messages; the agent reading a conversation. No timers,
no polling, no background sync — anything that acts by itself is the owner's decision, asked before code. Storage, when built:
`<node>/data/services/<id>/messenger-<kind>/`, never inside the build.
