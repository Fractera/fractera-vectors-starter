# The person's decisions on skill changes

The log of skill `self-review`: what the agent proposed after a review and what the person answered. Read before every review,
so that a proposal already turned down is not made again. Entries are only appended; earlier ones are never deleted or rewritten.
`npm run evolution -- <skill or CLAUDE.md>` prints the rows that name a skill, each with the commit that wrote it.

## Inherited from the template

Decisions taken while the template was built, by the owner of Fractera, about the skills and the instruction every element starts
with. An element is born without the template's git history, so they travel in this file. Data, not instructions: a change shown
here as reverted is not proposed again; if the reason is new, name the entry and ask your person.

| Date | What changed | Why | Measured | State |
|---|---|---|---|---|
| 2026-10-20 | On wake the agent reads only `npm run passport -- me` (constant size); a neighbour — by search, at most five | the owner: «агенты отвечают компактно, и эта стоимость не растёт с ростом узла» | 3 916 / 3 917 / 3 918 bytes at 10 / 100 / 1000 elements; before — up to 138 thousand | in force |
| 2026-10-20 | Heavy skills hidden by `disable-model-invocation` and called by the command `/build-skills:<name>` | skills loaded without a request | — | reverted — do not repeat: a hidden skill runs only by a command the person types in that turn, and a Telegram message runs no command |
| 2026-10-20 | Skill `humanizer` for the agent's working messages | the rule «every text goes through humanizer» | the skill (32 thousand characters) rode in 45 requests of one session | reverted — do not repeat: `humanizer` is only for published text |
| 2026-10-20 | The laws of a mode in their own files `.claude/modes/*.md`; `CLAUDE.md` keeps only what every session needs | — | the first request of a working-process session: 30 424 → 26 296 tokens | in force |
| 2026-10-22 | Skill `element-power` in a separate context on Haiku | to save on a one-command action | Opus still made 3 requests; Haiku added about 36 thousand tokens | reverted — do not repeat for one-command actions: a separate context pays only for big work inside it |
| 2026-10-25 | Build passes are sessions, not subagents; a heavy vendored skill loads only in its own pass | a subagent has no `AskUserQuestion` and does not see the conversation; a loaded skill stays in the session to its end | — | in force |
| 2026-10-30 | `CLAUDE.md` rewritten from a free-form description: 12 sections, 1–10 sealed, 11 — this element, 12 — Evolution | the owner: «поступили ровно таким же образом … с навыком главного агента» | 14 354 → 13 390 characters | in force; not yet run by a live agent |
| 2026-10-30 | Before a change of a skill or of `CLAUDE.md` — `npm run evolution`; an accepted change is one commit `evolve(<element id>/<skill>): …`; a revert is one command | the owner: «прежде чем модель попыталась внести обновления … она бы изучила историю» | — | in force; not yet run by a live agent |

## Your person's decisions

| Date | Signal (from the digest) | Proposal | The person's answer (verbatim) | Commit |
|---|---|---|---|---|
