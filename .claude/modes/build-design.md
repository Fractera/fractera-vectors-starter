# Design pass — the laws of this session

This file comes with the design pass of the build session (node step 590-5; rewritten by node step 706-4): the look of pages, designed
natively from the brief. The laws of building (`.claude/modes/build.md`) hold here too.

## The design pass

The owner of the node, 2026-11-09, verbatim: «стартовый шаблон не имеющий никакого Патерно проще развернуть в любую сторону». The look
of this element is its own (node steps 706 and 716): you design its pages yourself, from its brief, as a designer would — its tokens,
its `DESIGN.md`, its own sections; there is no shared catalogue of sections and no shared design to take them from.

- **What this pass does:** the brief read and, where it is empty, asked; `DESIGN.md`; the element's own sections with their words in
  page data; their look on this element's tokens (`DESIGN-CONFIG`); the highlight address on every container; the page seen with
  `npm run eyes` before anyone else sees it.
- **What it never does:** doors, data, the logic of a scenario, the final words people read — the main pass and the texts pass. A request
  for them: write `current-step.md`, then `npm run pass -- main "<the request>"` (or `texts`).
- **The skills of this pass:** the design skill the core handed to this element for this prototype (in `.claude/skills/`, its
  `SOURCE.md` names where it came from — your own collection, the node's base or the checked catalog), the pinned skill
  (`design.pinned.skill` of the passport) for every page after the pin, the slop checklist of `frontend-design-deslop`
  (`references/slop-checklist.md`) before «done», `shadcn` (through `use-shadcn`), `ai-elements` (through `use-messenger`) — the line
  `Pass:` of each one's `SOURCE.md` says where it lives. There is no list of design skills in this template: the person finds and picks
  them in the core's «Build → Design» tab.
- **End of the pass:** commit, write `current-step.md` (what is done, «next: the main pass»), tell the person in one line with the
  screenshot; switch with `npm run pass -- main "<the next substep>"` when the step goes on, or stop when the person wants to look first.

<!-- RULE: our-architecture -->
🔒 Our architecture, never theirs — non-cancellable (owner of the node, 2026-10-23:
«категорически запрещено в процессе проектирования переносить не оптимизированную механику в наш проект … элементы интерфейса и бизнес логики мы пере используем а техническую архитектуру сохраняем собственную»).
From a product studied by reverse engineering, screenshots or knowledge we take its interface
elements and its business logic — never its technical architecture. Pages stay static and readable without JavaScript, with the least
load on the server and the database; an endless feed becomes pages with server search. Whatever the studied product does without
search optimization, without static pages or with heavy load, we solve our own native way. Everything a study holds about a studied
product — REA's records in `study/`, screenshots, notes — describes another product: a source to learn from, never our own code, pages, routes or data.

## A design prototype — the order (node step 711)

The owner of the node, 2026-11-09, verbatim: «для каждого кандидата с референс сделать кнопку сгенерировать тестовую страницу … тестовой
страницы сохраняются в проекте с ссылкой … в защищенном пространстве … выбрать текущий навык который будет использоваться в архитектуре
записать его в own-service-props.json». The task «Build process, design: generate the prototype <id> …» comes from the core's Design tab;
it names the skill, the source page and the references. **Tokens first, the page second** — what the prototype shows is exactly what a
pin carries into the whole element:

1. `npm run prototype -- new <id> --skill <mark> --from <home|slug> [--ref <url> --ref-caption "<words>"]…` (the task gives the line).
2. Read the handed skill and the references (images: `/api/media/<id>/file`), and the brief (who it is for, character, what to avoid).
3. **`tokens.json` first** — the whole look in the shape of `DESIGN-CONFIG`: colours of both themes (surfaces `card`, `popover`,
   `input`, `ring` too), fonts from `lib/design/local-fonts.json` only, `type` (scale, leading, `headingWeight`), `shape` (radius,
   borderWidth, spaceScale, appWidth, `shadow`), `motion.speed`. The prototype's page shows these and nothing else.
4. **`DESIGN.md`** in the prototype's folder — the rules tokens cannot hold (composition, rhythm, imagery, «do» and «don't»).
5. **The page** — its words and sections in the prototype's `en.json` / `ru.json` (the same format as any page; empty home → write the
   page from the brief and the product's description). No colour in the words: `npm run prototype -- done` and `check:prototypes` refuse
   it. A section the element has not is this prototype's own until the pin: its folder in the prototype's `sections/` and its line in
   `sections/index.ts`, the same shape as `components/sections/` (`index.tsx` with `Section` and `Shape`, `markdown.ts`, `README.md`) —
   static, words from data, `data-block` on every container (`npm run widgets:ids`), colours only through tokens. It never repeats a kind
   of the element: a new look of an existing section is a new kind (`check:sections`). It is code: the page draws it after a build.
6. `npm run prototype -- done <id>`, then the screenshots into its `shots/`: `npm run eyes -- <this element's address>/<lang>/prototypes/<id>
   --out "app/[lang]/(protectedLayer)/prototypes/_pages/<id>/shots/desktop.png"` and the same with `--width 390` → `mobile.png`.
7. Commit; answer the core with the prototype's address (`npm run reply-core` when the task asks for it). Nothing goes to the public
   page until the pin.

**The pin** — the task «Build process, design: pin the prototype <id>»: commit, then `npm run design:pin -- <id>` (its tokens
become `DESIGN-CONFIG/design-config.json`, its `DESIGN.md` the element's, its words the source page, its own sections the element's —
folders in `components/sections/` with their lines; the passport records `designSkill` and `design.pinned`; the losers' sections leave
the tree — git keeps them, their records name the commit; every prototype goes to `_archive/` without code). It names the sections no
page uses any more — delete the ones nothing needs. Then `npm run describe:publish`, commit, «Preview & Deploy». From then on every page of this element follows the pinned look: read
`design.pinned` and `DESIGN.md` before any design work.

## The design of a page — the order

1. **The brief** — the passport's `design` part (`OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json`), written by the person on this element's
   «Design» page (`/<lang>/admin/design`, the first section): who the site is for, its character in up to five words, references (a link
   and/or an uploaded screenshot — `media`, shown at `/api/media/<id>/file`), what to avoid; the skill is pinned from the core's Design
   tab (`design.pinned`), never chosen here. `inheritedFrom` — the look
   came from a sibling element at birth: keep it unless the person changes it. **Empty or thin — ask the person once**, by the questions
   of the brief, and write the answers there through the same page or door (`/<lang>/admin/api/settings/brief`); never invent the audience.
2. **`DESIGN.md`** at the element's root, in the open DESIGN.md format (machine-readable tokens in the YAML header, prose after): the
   direction derived from the subject of the product and the brief, a small token system — and the tokens written into `DESIGN-CONFIG`
   (the «Design» page's fonts, colours, type, shapes, or the design door) so the header, the footer and every page follow them.
3. **The sections** — your own components in this element, as the product needs them; there is no catalogue to search. The section
   contract stays: words come from the language cells of page data (never hard-coded in JSX), every container carries `data-block`
   (`npm run widgets:ids`), the section is static, colours are tokens, and the machine copy of the page (`/<lang>/index.md`) carries its
   text. Pages of documents keep the three document sections (section-head, section-faq, section-warning-card); the table of contents is drawn by the page template.
4. **Seen before shown** — `npm run eyes` on the page at 1440 and 500 px; read it against the slop checklist and the brief's «avoid»;
   what reads as a template default is redone before the person sees it.
5. **Then stop:** commit, `current-step.md`, the screenshot to the person; their grade is the proof, not your opinion.

## Design skill

The design skill lives in the passport twice and in step: `design.skill` and `designSkill` (the indicator and `npm run design-skill` read
the latter). It is set by the pin (`npm run design:pin`) from the core's «Build → Design» tab — the person finds design skills there
(their own collection first, the node's base, the checked catalog), tests them as prototypes and pins the winner. Read the pinned skill
and `DESIGN.md` before any design work and work in its method. `npm run describe:publish` carries the passport to the core — so a sibling
element can be born with this look (`create --look-like <this id>`).
