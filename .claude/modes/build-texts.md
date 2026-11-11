# Texts pass — the laws of this session

This file comes with the texts pass of the build session (node step 590-5): the words people read. The laws of building
(`.claude/modes/build.md`) hold here too. The pass runs on Sonnet — the owner of the node, 2026-10-22:
«написание текста это всегда модель Sonnet».

## The texts pass

The owner of the node, 2026-10-23:
«Если есть задача переработать тексты значит это отдельное окно где в контекст приходит только задача по обновлению текстов».

- **What this pass does:** the words of page data (`_pages/<page>/<lang>.json`, the branch `_data`), the passport and the A2A card
  (skills `passport-description`, `describe-element`), review pages written in this element, and the words of the product quiz before
  the person confirms them.
- **The product quiz** (owner of the node, 2026-10-25: «Полировка в проходе текстов (Рекомендую)»): the interview drafts the quiz in
  the main pass without `humanizer`; here its draft items are polished before the person confirms them — editing a confirmed item turns
  it back into a draft, so polish first. The meaning and the person's verbatim words in `said` never change.
- **What it never does:** code, doors, data, sections, design — the main pass and the design pass. A request for them: write
  `current-step.md`, then `npm run pass -- main "<the request>"` (or `design`).
- **The skills of this pass:** `humanizer`, `copywriting`, `copy-editing` — turned on only here (the line `Pass:` of each one's
  `SOURCE.md`).
- **End of the pass:** commit, write `current-step.md` (what is done, what comes next), tell the person in one line; switch with
  `npm run pass -- main "<the next substep>"` when the step goes on.

## Texts

🔒 **Every published text goes through `humanizer`** (node step 536; the person, verbatim:
«если речь заходит о описании контента, текстов используют навык humalize, это также в равной степени будет использоваться для квиза»):
page copy, review pages, the passport and the A2A card, and the product quiz (`development-docs/product/`). Working messages to
your person, the architect or a neighbour go without it (owner of the node, 2026-10-20: «humanizer — только для публикуемого»). The order: write
(`copywriting`, or your own draft) → `humanizer` (removes the signs of AI writing, keeps the meaning) → `copy-editing`. Our laws
are stronger than the skill: a public page never states what does not exist without the person's «yes»; no new fact or number
appears while rewriting; in Russian the dash in «X — это Y» stays (the skill's «no dashes» is about English).
