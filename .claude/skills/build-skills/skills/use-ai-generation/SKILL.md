---
name: use-ai-generation
description: >
  Builder skill. When THIS element calls a model itself and when the work belongs to a neighbour; where the key and the model come
  from; what the vendored `ai-sdk` may not decide here. Load it before writing anything that generates, extracts, classifies,
  summarises or decides with a model, when the person asks for pictures, video, voice or texts made by AI, and when `ai-sdk`
  offers the AI Gateway, a model id or a provider install.
---

# use-ai-generation

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

The vendored `ai-sdk` (`.claude/skills/ai-sdk/`, its `SOURCE.md`) says HOW the AI SDK works. This skill says WHEN this element uses it.

## 1. Own call or a neighbour — the boundary (node step 717-6)

- **Your own call** — a model step inside THIS element's own role and data: a draft of a field, a classification of your own rows, a
  summary of your own page, a reply of your own help desk. Small, server-side, its result checked by your code.
- **A neighbour's job** — a capability that is a field of its own: pictures, video, voice, music, long creative texts for others,
  statistics of a channel. Never grown inside you: `npm run need -- "<what>" --use "<what for>"` (skill `need-capability`) — the core's
  main agent names the element that does it, or asks the architect to build one; you call its door (skill `use-i2i`).
- **A ready tool first** — `_tools/` already has voice input, a draft from free words, socials by AI (skill `use-tools`). Use it inside a
  widget before writing a call.
- Not sure which side a job is on → it is a neighbour's until the person says it is yours (section 11 of `CLAUDE.md`, your role).

## 2. The key, the model, the money

- The key: `openAiKey()` from `lib/openai-key.ts` — the one reader; never `process.env` in a route, never in a browser, never in git.
  It is the node's OpenAI key: every call is paid from the person's OpenAI account. No key → say so in one line; never fall back to
  something else.
- 🛑 Never the Claude subscription for the site's own work: the subscription runs agents, not the element's runtime calls.
- 🛑 No AI Gateway (`AI_GATEWAY_API_KEY`): a second path for the key diverges silently.
- The model id is a setting: `process.env.OPENAI_TEXT_MODEL`, the person's choice; a literal in code is a debt (`_tools/*/server/*`
  carry `?? "gpt-4o-mini"` — do not copy it into new code).
- `ai@7` with `@ai-sdk/openai@4` are already installed; the documentation of THIS version is inside the package,
  `node_modules/ai/docs/` — read it there before typing an API name, never from memory.

## 3. Two laws that survive every SDK

- **A model proposes, your code applies.** A closed list (a status, a category, a menu item) is checked by your code; a draft that fails
  the check is dropped whole. What the person must approve, the person approves.
- 🛑 **No `eval`, no `new Function`** — whatever the model writes never runs.
- A call is a route with its `// @api` line (`check:api`), never a `fetch` from a component.
- A person's own words or data in a prompt — skill `use-personal-data` first: the model gets the case, never the person.
