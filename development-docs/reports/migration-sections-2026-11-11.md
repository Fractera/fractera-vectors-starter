# Migration «block → section» — 2026-11-11

Node step 717-2: one word, «section», for a designed part of a page; a section is one folder `components/sections/<kind>/`; a page's
list is `body`. «Block» keeps one meaning — the address of a container (`data-block`, `#block=`, `npm run blocks:ids`).
Script `scripts/migrate-sections.mjs`, map `scripts/migrate-sections.map.json`.

## Done (2)

- rewritten `app/[lang]/(publicLayer)/_data/en.json`
- rewritten `app/[lang]/(publicLayer)/_data/ru.json`

## For your eye (4)

Each line: change the sense «section» to «section» (in Russian «секция»), keep the address; a line that is right as it is stays.

- `app/[lang]/(publicLayer)/_widgets/static/widget-static-vectors-landing/README.md:5` — «block» left — the sense «section» becomes «section»; the address (`data-block`) stays: «draws it from the items of the page data ('(publicLayer)/_data/<lang>.json'): a section is 'section-head' and the blocks up to the»
- `app/[lang]/(publicLayer)/_widgets/static/widget-static-vectors-landing/README.md:6` — «block» left — the sense «section» becomes «section»; the address (`data-block`) stays: «next, its view chosen by its 'id' ('route' beside the hero, 'solves', 'spaces' with the catalogue block 'section-access-map', 'connect',»
- `app/[lang]/(publicLayer)/_widgets/static/widget-static-vectors-landing/README.md:8` — «block» left — the sense «section» becomes «section»; the address (`data-block`) stays: «blocks ('lib/aio/page-to-markdown.ts'), so 'markdown.ts' returns nothing. Claims only about what is built, checked against README.»
- `lib/data-store/vectors.mjs:4` — «block» left — the sense «section» becomes «section»; the address (`data-block`) stays: «// 654-3: чьи векторы — у каждого элемента свои коллекции (блок "WHOSE VECTORS" ниже); обработчики четырёх дверей знают вызывающего.»

## Then

`npm run prebuild`, `npx tsc --noEmit`, the build, `npm run eyes` on a page with sections, one commit.
