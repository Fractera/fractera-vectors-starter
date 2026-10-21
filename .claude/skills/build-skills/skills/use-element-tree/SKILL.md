---
name: use-element-tree
description: >
  Builder skill. The exact file tree of this Fractera element — where every kind of file lives (instruction, passport, node
  contract, development documents, skills, tools, branches with their pages, widgets, components, logic and doors) and which
  folders every branch must have. Load it before creating, moving, renaming or deleting any file or folder of this element,
  before adding a page, a widget, a tool, a door or a branch, and when you are not sure where something belongs. The thing you
  cannot guess: the structure is not a habit but a contract — guards refuse the build when a branch lacks a required folder, a
  route file appears outside the closed list, or a widget sits outside its branch, and deleting a branch must leave nothing behind.
  Load it too whenever a page, a branch or a file of the starting tree is missing or was deleted, or `check:tree` prints `нет …` —
  the section «Restore the starting architecture» brings the element back from its git history or its template tag.
  Russian phrasings of the person: «дерево проекта», «куда положить файл», «удалили страницу», «верни как было», «стартовая архитектура».
---

<!-- PROOF · PROVEN 2026-10-12 (restore section; loaded, answer right) · report: development-docs/proofs/2026-10-12-six-skills.md (in roman) -->

# use-element-tree

> Not a hint: the element's tree matches this file exactly (CLAUDE.md). Changing the tree itself is the person's decision.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## The tree

```
<element>/
├── CLAUDE.md                 ← what every session needs; the laws of each mode in .claude/modes/ (552-5)
├── OWN-SERVICE-PROPS/        ← the passport, the main door: its JSON, README, server; A2A-CARD.json (the A2A card)
├── NODE-CONTRACT.json        ← what the node needs to install and manage this element (never served outside)
├── development-docs/         ← how this element is being built (git, English only)
│   ├── README.md
│   ├── current-step.md
│   ├── steps-new/ · steps-done/
│   ├── pre-steps/ (README.md, handled/)
│   ├── glossary.md · anti-patterns.md     ← useful notes, carried to every element born from this one
│   ├── backlog.md · cancelled.md · reports/ (README.md)
│   ├── proofs/
│   ├── owner-decisions-on-skill-changes.md
│   └── translation-debt.md
├── _tools/                   ← the element’s tools: tool-<name>/ with tool.json; TOOLS.json generated; README (skill use-tools)
├── .claude/
│   ├── modes/ (build.md · work.md)  ← the laws of the build and working-process sessions, added by the node to the session
│   ├── skills/*
│   └── hooks/*
├── lib/
│   ├── page-tree.ts
│   └── branch-page.tsx
├── scripts/
│   ├── check-routes.mjs
│   ├── check-dev-docs.mjs
│   ├── check-tree.mjs          ← 462: the starting tree is in place (prints what is missing)
│   └── tree-manifest.mjs       ← 462: writes the snapshot (template only, before a tag)
└── app/[lang]/
    ├── layout.tsx
    │
    ├── (publicLayer)/
    │   ├── README.md
    │   ├── api/<name>/route.ts    ← a door of this branch → /<lang>/api/<name> (guards itself)
    │   ├── page.tsx
    │   ├── _data/ {meta,en,ru}.json
    │   ├── _components/README.md  ← required: the branch's own components
    │   ├── _libs/README.md        ← required: the branch's own logic
    │   ├── _widgets/README.md     ← required: the branch's widgets (static/ · dynamic/)
    │   ├── [slug]/
    │   │   ├── page.tsx
    │   │   ├── index.md/route.ts
    │   │   └── README.md
    │   └── _pages/
    │       ├── README.md
    │       ├── privacy/       {meta,en,ru}.json
    │       ├── terms/         {meta,en,ru}.json
    │       ├── cookies/       {meta,en,ru}.json
    │       └── accessibility/ {meta,en,ru}.json
    │
    ├── (protectedLayer)/
    │   ├── layout.tsx
    │   ├── README.md
    │   ├── account/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── _data/ {meta,en,ru}.json
    │   │   ├── _components/README.md  ← required: the branch's own components
    │   │   ├── _libs/README.md        ← required: the branch's own logic
    │   │   ├── _widgets/README.md     ← required: the branch's widgets (static/ · dynamic/)
    │   │   ├── [...slug]/page.tsx
    │   │   ├── README.md
    │   │   └── _pages/
    │   │       ├── README.md
    │   │       ├── user/ · vip-user/ · subscriber-lite/ · subscriber-standard/ · subscriber-max/
    │   │       └── buyer/            ← role folder: the role's page and its pages
    │   │           └── orders/       ← /<lang>/account/buyer/orders
    │   ├── staff/
    │   │   ├── layout.tsx · page.tsx · _data/ · [...slug]/page.tsx · README.md
    │   │   ├── _components/README.md · _libs/README.md · _widgets/README.md
    │   │   └── _pages/ manager/ · senior-manager/ · support-manager/ · delivery-manager/ · content-editor/
    │   ├── finance/
    │   │   ├── layout.tsx · page.tsx · _data/ · [...slug]/page.tsx · README.md
    │   │   ├── _components/README.md · _libs/README.md · _widgets/README.md
    │   │   └── _pages/ finance/
    │   └── admin/
    │       ├── layout.tsx · page.tsx · _data/ · [...slug]/page.tsx · README.md
    │       ├── _components/README.md · _libs/README.md · _widgets/README.md
    │       └── _pages/ admin/ · users/ · site-settings/
    │   └── messenger-h2a/          ← 459: H2A Messenger — only the architect; UI only from ai-elements (skill use-messenger)
    │       ├── layout.tsx · page.tsx (list of conversations) · _data/ {meta,en,ru}.json · README.md
    │       ├── _components/README.md · _libs/README.md · _widgets/README.md
    │       ├── _widgets/dynamic/widget-dynamic-messenger-h2a/  ← the window
    │       └── [...slug]/page.tsx · README.md   ← /<lang>/messenger-h2a/<conversation>, dynamic
    │
    └── (guestLayer)/
        └── guest/
            ├── layout.tsx
            ├── page.tsx
            ├── _data/ {meta,en,ru}.json
            ├── _components/README.md · _libs/README.md · _widgets/README.md
            ├── [slug]/page.tsx
            ├── README.md
            └── _pages/README.md
```

A branch = `layout.tsx` + `page.tsx` + one child route. Everything below the branch root is data in `_pages/`.
🔒 Every branch root has three required folders, each with a README that says what goes in it (owner 2026-10-07):
`_components/` — the branch's own components (server by default, islands `*.client.tsx`; shared ones go to `components/`);
`_libs/` — the branch's own logic without markup (shared logic goes to `lib/`); `_widgets/` — the branch's widgets,
`static/widget-static-<name>` or `dynamic/widget-dynamic-<name>`, listed in the branch's `_widgets/index.tsx` (the only own blocks a page may show — `scripts/check-page-composition.mjs`). Code of a
branch lives only there. `scripts/check-routes.mjs` refuses the build when a branch lacks one of them or its README.
Every route folder and every `_pages/` has a `README.md` with a full example of a page folder — enough to add a page.

## Rules the guards keep

- `scripts/check-routes.mjs` — every route file is in its closed list (a new page is a data folder, never a `page.tsx`); every
  branch root has `_components/`, `_libs/`, `_widgets/` with a README.
- `scripts/check-page-sequence.mjs` — a page names only `block-*`, `text-*` and its own branch's `widget-*`.
- `scripts/check-protected.mjs` — under `_widgets/` only `static/`, `dynamic/` and `index.tsx`.
- A new branch, a new top-level folder or a moved one — ask the person first (`.claude/modes/build.md`, «Page»: a route owns its own).
- `scripts/check-tree.mjs` (node step 462) — compares this element with the starting tree of its template
  (`.claude/skills/build-skills/skills/use-element-tree/tree-manifest.json`) at every build and prints every missing path. It never fails the build:
  removing a page by the person's word is legal, removing it silently is visible. Verdicts: present · **exception** (the path is in
  `development-docs/tree-exceptions.json` with the person's words why it is gone) · **debt** (missing, no reason — printed until it
  is restored or explained).

## Restore the starting architecture (node step 462)

Owner, 2026-10-12: «я не уверен в том что однажды какой-нибудь агент не повредит наше дерево например, он решит просто удалить
лишние страницы, и тогда задача навыка была предоставить решение чтобы вернуть проект к нужной стабильной стартовой архитектуры».

**The source of truth is never your memory.** It is two things: the element's own git history, and the template tag it came from
(`tree-manifest.json` → `template`, `after`; the node's current tag — `WEB4-ITEMS-REGISTRY/item-template.json` in the core).

1. **See what is missing.** `npm run check:tree` — every `нет <path>` line is a path of the starting tree that is gone.
2. **Find when it went.** `git log --diff-filter=D --name-only --format='%h %ad %s' -- <path>` — the commit that removed it and its
   message (was it the person's word?).
3. **Ask before you restore.** Show the person the list: path, the commit that removed it, its message. A removal made by their word
   is not undone — it becomes an exception instead (step 5).
4. **Restore.** From the element's own history: `git checkout <commit>^ -- <path>` (the version right before the removal). The path
   never existed in this element (born from an older template) → take it from the template tag:
   `git clone --depth 1 --branch <tag> https://github.com/Fractera/fractera-custom-item-starter.git <scratch>` and copy the path over.
   Then `npm run prebuild` — every guard green, `check:tree` prints `===TREE_OK===`.
5. **Record an intended removal.** `development-docs/tree-exceptions.json`:
   `{ "paths": { "app/[lang]/(publicLayer)/_pages/chain": "owner 2026-10-12: «Another remove»" } }` — the person's words, verbatim.
   A folder covers everything inside it.

🛑 Never restore over the person's newer work without asking: a path that exists but differs from the template is not a debt —
the tree is the starting point, not a cage. Never «fix» a debt by adding an exception yourself: an exception carries the person's
words or it does not exist.

The snapshot is written in the template only: `node scripts/tree-manifest.mjs <tag>` right before tagging a new template version.
