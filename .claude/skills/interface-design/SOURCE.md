# SOURCE — vendored, do not edit by hand

- **What:** `interface-design` by Damola Akinleye (dammyjay93), MIT (see `LICENSE`): craft-first design of product interfaces —
  dashboards, administration panels, settings pages, tools and data screens. Not for landing pages.
- **From:** https://github.com/dammyjay93/interface-design — `.claude/skills/interface-design/SKILL.md` at commit
  `2f9be3206855bcb2d1d0af262c8bae25cba6658d`, blob `92e1df4e` (the blob the Fractera skills catalog checked: ★5.9k, 31.7k installs,
  «install»), taken 2026-11-10, node step 714-4.
- **Taken:** `SKILL.md`, `LICENSE`. Not taken: `agents/`, the plugin folders and the `/interface-design:*` commands — nothing here runs.
- **Why:** the owner 2026-11-10, verbatim: «перенёс этот навык в инструкцию ядра и элементов с подсказкой использовать при моделирование
  административных панелей и дашборда» — the core's Design and Site settings tabs (node step 713) were rebuilt by it and accepted:
  «интерфейс получился значительно лучше».
- **Update:** download `SKILL.md` of the wanted commit over this one and change the line «From». Never edit by hand.
- **What our rules override:** only this element's primitives (`components/ui/`, skill `use-shadcn`) and colours as tokens of
  `DESIGN-CONFIG`; every container carries `data-block`; words through the dictionaries; «render it» means `npm run eyes` at 1440 and
  390 px (skill `use-eyes`) — no inline render tool and no image generation; `.interface-design/system.md` is not created — the element's
  design decisions live in `DESIGN-CONFIG` and `development-docs/`. A public page of the site is the design pass's work, not this skill's.

Process: build — a vendored skill for the screens a person works in: the admin panel, dashboards, settings.
Pass: main, design — the admin screens are built in the main pass and reviewed in the design pass.
