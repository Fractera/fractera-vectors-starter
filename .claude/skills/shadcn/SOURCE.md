# Where this skill came from, and how it is updated

**This folder is FOREIGN CODE, vendored on purpose. Do not hand-edit a single file in it.** A hand edit survives only until the
next update, which overwrites instead of merging. Everything WE have to say about it lives in `../use-shadcn/SKILL.md` — ours,
never overwritten, and louder than this skill wherever they collide.

| | |
|---|---|
| skill | `shadcn` — shadcn/ui components, CLI, registries, styling and composition rules |
| source | `github.com/shadcn/ui`, path `skills/shadcn/` |
| installed with | `npx skills@latest add shadcn/ui -s shadcn -a claude-code -y --copy` |
| installed as | **copies, not symlinks** — a symlink in a repository cloned on Windows is a missing file |
| recorded in | `skills-lock.json` at the element root, with the content hash |
| installed on | 2026-10-07, node step 425-2 |
| update | `npx skills update` — then read the diff before committing it |

## Before you trust it

1. **It runs a command when it loads:** `SKILL.md` embeds `` !`npx shadcn@latest info --json` `` to learn the project. Offline,
   that line yields nothing and the written rules still work.
2. **Not used here:** `evals/` (test prompts — the owner forbids test runs of skills) and `agents/openai.yml` (a config for
   another vendor's agent).
3. **Deliberately not installed:** `migrate-radix-to-base` from the same repository. This element carries both Radix and
   Base UI; a migration is a project-wide rewrite — the owner's decision, not an agent's.

Process: build — a vendored design/text/UI skill, used only while building this element (node step 465-4).
Pass: main, design — components: the code of the main pass and the blocks of the design pass need them (node step 590-5).
