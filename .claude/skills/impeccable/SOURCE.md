# SOURCE — vendored, do not edit by hand

- **What:** `impeccable` by Paul Bakaus, Apache License 2.0 (see `LICENSE`, `NOTICE.md`).
- **From:** https://github.com/pbakaus/impeccable — folder `.claude/skills/impeccable/`, commit `9d715cc` (skill version 4.4.0),
  taken 2026-09-28 (node step 330-5).
- **Taken:** the skill folder (`SKILL.md`, `reference/`, `scripts/`) as copies.
- **NOT taken, on purpose:**
  - the repository's `.claude/settings.json` hooks (SessionStart, PostToolUse, Stop run the Impeccable engine by themselves after
    every edit) — the node forbids behaviour nobody ordered;
  - the four agents in `.claude/agents/` — sub-agents are forbidden in this project (all development is sequential); the skill's
    own `reference/degraded/*.md` is the path without them.
- **The launcher downloads a binary.** `scripts/impeccable` fetches a self-contained engine into `~/.impeccable/bin/` on its
  first run. Do not run it unless the owner said yes in this conversation; without it follow the skill's own «Launcher
  unavailable» path (read PRODUCT.md / DESIGN.md directly and continue).
- **Update:** `npx impeccable install --providers=claude --scope=project` in a scratch folder, or clone the repository, then copy
  the skill folder over this one without hooks and agents, and write the new commit here. Never edit the copy by hand.
- **When it is used, and what our rules override:** skill `custom-design` next to this folder.

Process: build — a vendored design/text/UI skill, used only while building this element (node step 465-4).
