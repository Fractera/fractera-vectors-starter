# Build process — the laws of this session

This file comes with the build session of the element's agent (node step 552-5); `CLAUDE.md` holds what every session needs.
A plain question and a message from Telegram come to this session too, until the messenger gets its own (node step 552-6).

## Confirm the request first — in the build process only

**Build process** — the request changes this element as a thing: code, design, texts, deploy. People often cannot say exactly
what they want, and a misunderstood build costs far more than one message. Before any building answer first with three lines in
the person's language, and start only after their «yes» or correction:

> If I understood you right, you are asking for … .
> To do it I will … — what I will touch, and what I will not.
> In the end you will see … — and this is how we will know it is done: … (next section).

Building — after the «yes», before the first edit: follow «Steps» below.
If the work turns out to need more than you named — code instead of data, other files — stop and say so before doing it:
the «yes» covered your plan, not a different one. A plain question is answered at once. A task from another element (i2i) has no person to wait for: put the same three lines at
the top of your reply instead.

## Plan the checks before the work — building

The checks that will prove the work done are named **before** it starts — in that confirming message, so the person agrees with
them: what you will run (the full `npm run prebuild`, a guard spoiled on purpose, a live request) and what the person will see,
and where. Then build to pass them. A check chosen after the work tends to prove what was easy, not what was asked; a check you
could not run is said so — never swapped for an easier one.

## Steps — every building task goes through them, however small

The documents in `development-docs/` are how building survives an ended session; skill `use-development-docs` has the details.
A word of the person, a term in this file or a skill that can be read two ways → `development-docs/glossary.md` first; a new
term that two places use → into the glossary in the same commit.

1. **On wake into building:** read `current-step.md`, then `pre-steps/` — a non-empty intake is named to the person first. If
   the element has a product quiz, read its index `development-docs/product/quiz.json` too (the modules only when a task needs them).
1a. **A wish that changes what the product does** («and also I need…»: a new role, a new kind of thing, a new money flow, an
   outside service) **and every task from the core's quiz page** («Product quiz, item S-NN …») → skill `product-quiz` first: the
   impact on the quiz before the plan of the step; the step names the items it serves in one line `Serves:` (node step 536).
1b. **A capability this element does not have yet** → before any plan, the order «Before you build a new capability» (owner of
   the node, 2026-10-19); each step is cheaper than the next, stop at the first that answers: yourself (`npm run passport -- me`)
   → a neighbour in the node, i2i (`npm run a2a -- find <English words>`, at most five; its door if it has one — a plain call, no
   model; no door — wake its agent once to agree an API, `use-i2i`) → build it here when the need is your role:
   **a clear request** (input and output named, from a neighbour or your person) at once, the short way (2a), without the quiz
   (2026-10-20); a new product or «and also I need…» —
   `product-quiz`; copying how an existing site works — reverse engineering is under development in the core: say so and use the
   quiz. Not your role → the core's main agent makes a new element (its terminal — `node.mainAgent` of the passport).
2. **A new step:** the three confirming lines → «yes» → load `use-development-docs` → take the next number → write the step
   into `current-step.md` BEFORE the first edit. More than one result → also `steps-new/<N>-<words>.md`: substeps, one
   observable result each, with their checks — and the person agrees to the substeps before code.
2a. **A small task** (one door, one fix) goes the short way (owner of the node, 2026-10-20): the three lines → «yes» → a line in
   `current-step.md` → build (a door: `add-door`) → `steps-done/<N>.md` and `current-step.md` → `npm run check:dev-docs` (the build
   refuses Russian outside «quotes», a guard's Russian output too) → one commit. No `steps-new`, no quiz modules; `use-development-docs`, `anti-patterns.md`, `backlog.md` — only when something breaks or is left undone.
3. **A substep inside the running step** — only for the same capability, after the person's «yes»: add `<N>-<k>` to the plan
   and to `current-step.md`; it closes with a commit whose hash goes into `current-step.md` at once.
4. **Anything else arriving mid-step** — the person's other wish, a building request from another agent or the core's task
   window — is not started: it goes to `pre-steps/` verbatim (law in `pre-steps/README.md`) and is named to the person.
5. **A closed step that gets one more substep** is reopened: active again in `current-step.md`, and when done it is closed
   again as a whole — `steps-done/<N>.md` rewritten, never an addendum file.
6. **Closing:** `steps-done/<N>.md` (what, how, commits, the evidence of each check, what is not checked, mistakes), the plan
   leaves `steps-new/` and a handled request moves to `pre-steps/handled/` in the same commit, `current-step.md` updated.
   In the same commit: left undone or promised → `backlog.md`; cancelled by the person → `cancelled.md`; a cause found the
   hard way → `anti-patterns.md`; the last step of a capability → `reports/feature-…`. Every document of `development-docs/`
   exists from birth, empty or not — never delete one because it is empty.

`current-step.md` is rewritten on every event — a decision (verbatim), a commit (hash), a found defect, before a long
operation — not only at the end: if the session ended now, nothing from the last half hour may be lost.

**Commit messages and annotated tag messages are written in English only** (owner of the node, 2026-10-09): auditors and fund
representatives will read this history. The person's verbatim words in another language go into `development-docs/`, not into
a commit message.

## Skills of the build session

| Group | Mode | Skills |
|---|---|---|
| build-skills | build | `add-door` (a door for a neighbour: `npm run door:add` writes the route, the key and the card — you write the work), `backup-schedule` (backup of this memory element: the service is code, the schedule is data), `use-i2i`, `build-widget`, `cloudflare-connection`, `connect-google-analytics`, `connect-own-domain`, `custom-design` (the gate to `design-taste-frontend` and `impeccable`), `deploy-element`, `describe-element`, `github-element`, `github-repositories`, `own-domain-sign-in`, `page-snippet`, `passport-description`, `product-quiz` (the product in product words before code; every «and also I need…» goes through it), `project-origin`, `self-review`, `soft-navigation`, `temporary-domain`, `use-auth`, `use-development-docs`, `use-element-tree`, `use-highlight`, `use-languages`, `use-machine-copy`, `use-messenger` (the gate to `ai-elements`), `use-page-tree`, `use-shadcn` (the gate to `shadcn`), `use-site-menu`, `use-tests-before-dev-finish`, `use-tools`, `use-typography` |
| vendored | build, name only (`SOURCE.md`) | `ai-elements`, `copy-editing`, `copywriting`, `design-taste-frontend`, `humanizer` (published texts only, section «Texts»), `impeccable`, `shadcn` |

**A skill starts with its process and its group** (owner of the node, 2026-10-12 and 2026-10-20: an agent that creates a skill
must first decide whether it belongs to the working or to the build process). Creating or rewriting a skill: first decide its
process; the `description` starts with `Builder skill.`, `Work skill.` or `Both natures.`; the body says what follows (build:
code, commit, rebuild, the three confirming lines; work: data only, no commit, no rebuild, a short answer). The skill folder goes
into the group of its mode — `.claude/skills/<group>/skills/<name>/SKILL.md` — and into that group's row of this table: a skill
at the root of a group is not loaded at all, an own skill at the root of `.claude/skills/` would be loaded in every mode. A vendor
skill (a `SOURCE.md` beside it) stays at the root and keeps its own text — its process is the line `Process: …` in its
`SOURCE.md`. `npm run prebuild` fails on a skill without a process or outside its group (`scripts/check-skill-process.mjs`).

## Design skill

The design skill this element is built with lives in the passport `OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json`, field
`designSkill`: the skill's name (`impeccable`, `design-taste-frontend`) or `""` when none. The field is always there; it is never
written in `NODE-CONTRACT.json` (owner 2026-10-07). Read it before any design work and work in that skill's style; when the person
picks another skill (`custom-design` asks which), write its name there and run `npm run describe:publish` — the core takes it
into its registry («Take into core»).

<!-- PROOF 5 START · «Page» · PARTIAL 2026-10-07: the tab is now named «Live site» (line about addresses) — not re-proven; the skill use-machine-copy added to the list (step 428) — not proven; PROVEN before it: a live agent built a page, two widgets and voice in a widget by these laws (data not route files, one sequence in en/ru, shadcn only, tools inside widgets, addresses with #block=) and refused a tool in page data and a raw button; guards spoiled → refused · report: development-docs/proofs/2026-10-07-page-skills.md -->
## Page

**What we want.** Every page is static: served even by the Cloudflare copy while this computer is off, readable without
JavaScript. Live parts are islands over the static page — no server, the island shows its skeleton, and the page stays whole
and does its job as far as it can. Built for high load, with as few database queries as possible. New content appears
without a rebuild (ISR); a dynamic piece is added only when nothing else can do the job.

**A route owns its own.** Widgets, components, functions, data and translations one route needs live in its folder: delete
the route and everything that served it is gone, no tails. Only what two or more routes use goes up to `components/`, `lib/`,
`_tools/`.

**Languages are files.** A translation is one more language file next to the base; until it exists the page answers in the
default language.

**What a page is made of.** Data, not a route file: one sequence of `block-*` · `text-*` · `widget-static-*` /
`widget-dynamic-*`, the same in every language. The look comes only from the design tokens through blocks, typography and
shadcn — no own styles. A tool never stands on a page, only inside a widget.

**Only shadcn.** Widgets, tools, blocks and every component they use are built from `components/ui` — never a hand-made
button, field, table, window or toast; a missing one is added with `npx shadcn add`. An own look (a design skill) is shadcn
with its own classes, not a raw tag.

**Every container has an address.** The person points at anything on a page in the tab «Live site» of this element in the core and gets its address for a task;
you finish by returning the link `#block=<bid>` of what you changed. A container without an address fails the build.

**Before you build, load the skill of that work** — the laws above say what must come out, the skills say how, with the
names of the guards: `use-page-tree` (pages, blocks) · `use-typography` (text) · `build-widget` (widgets and their doors) ·
`use-tools` (tools) · `use-shadcn` (components) · `use-highlight` (addresses, both directions) · `use-machine-copy` (what a
public page gives agents: its Markdown copy, llms.txt — a widget brings its own `markdown.ts`) · `soft-navigation` (links, header and menu — moving between pages without a reload, and how to prove it on the own domain) · `deploy-element` (how a change reaches visitors) · `github-element` (saving the work to its repository). ✗ 2026-10-07: a widget built
from reading code alone and a guard named wrong — both were in the skill that was not opened.
<!-- PROOF 5 END -->

## Texts

🔒 **Every published text goes through `humanizer`** (node step 536; the person, verbatim:
«если речь заходит о описании контента, текстов используют навык humalize, это также в равной степени будет использоваться для квиза»):
page copy, review pages, the passport and the A2A card, and the product quiz (`development-docs/product/`). Working messages to
your person, the architect or a neighbour go without it (owner of the node, 2026-10-20: «humanizer — только для публикуемого»). The order: write
(`copywriting`, or your own draft) → `humanizer` (removes the signs of AI writing, keeps the meaning) → `copy-editing`. Our laws
are stronger than the skill: a public page never states what does not exist without the person's «yes»; no new fact or number
appears while rewriting; in Russian the dash in «X — это Y» stays (the skill's «no dashes» is about English).

## Report what a person can see

If the work touched anything a person can see, give the link to it — the page
`https://<element address>/<lang>/<path>` and each changed place with `#block=<bid>` (skill `use-highlight`). In Telegram write the
full address so it is clickable; it opens the page. The place lights up only when the link is pasted into the field of the tab
«Live site» («Живой сайт») of this element in the core and «Find» is pressed — say that in one line (skill `use-highlight`).

## Tree

**The file tree of this element matches the skill `use-element-tree` exactly** — load it before you create, move, rename or
delete any file or folder. Guards refuse a build that leaves it; a change of the tree itself is the person's decision.
Something of the starting tree is gone (`npm run check:tree` lists a missing path) → the skill's section «Restore the starting
architecture»: find the removing commit, ask the person, restore from git history or the template tag (node step 462).

## Highlight addresses — every container, no exceptions

The owner of the node, 2026-10-23, verbatim: «непоколебимый стандарт по отношению к всему коду всегда требует атрибуты для подсветки
контейнеров том числе без каких-либо ограничений это распространяется на блоке и все их контейнеры». And the same evening: «любой код
разрабатывать с этим атрибутом».

- Every container you write — in a page, a widget, a tool, a component, a block — carries `data-block="<letter + 4 base36>"`. The
  highlight of the tab «Live site» sees only `[data-block]`: a container without it cannot be pointed at, the person's task about it
  arrives vague, and your answer cannot point at the place you changed.
- After you write or change code, run `npm run widgets:ids` — it stamps every container that has no address; `npm run prebuild`
  refuses one without. Never remove or rename an address that stands.
- A block of the catalogue arrives with its addresses (`npm run blocks -- add`, the Blocks element stamps them at the source); never
  strip them. A container the stamp does not know (your own wrapper) passes `...props` to its DOM root, and its name goes into
  `CONTAINERS` of `scripts/stamp-widget-ids.mjs`.
- How the person uses the addresses and how you answer with `#block=<bid>` — skill `use-highlight`.
