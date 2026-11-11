# `prototypes/_pages/` — one folder per design prototype

Made by `npm run prototype -- new <id> --skill <mark> [--from home|<slug>]` (step 711-4), filled by the element's design pass, closed by
`npm run prototype -- done <id>`, pinned by `npm run design:pin -- <id>`. A folder holds `meta.json`, `en.json`, `ru.json` (the page's
words, the same format as any page of a branch), `tokens.json` (its own copy of the design document — the shape of `DESIGN-CONFIG`),
`DESIGN.md` (the rules of the look that tokens cannot hold), `prototype.json` (skill, source page, references, status), `sections/`
(its own sections, below) and `shots/` (screenshots for the core's Design tab). The page takes colours, fonts and spacing only from
`tokens.json` — `check:prototypes` guards it.

**Its own sections (step 717-3)** — `sections/` is a set of the same shape as `components/sections/`: `index.ts` names each section,
each section is a folder named by its kind (`index.tsx` with `Section` and `Shape`, `markdown.ts`, `README.md`). The prototype's page
draws the element's set and its own (wired by the generated `../_components/prototype-sections.ts`); a kind of the element is never
repeated (`check:sections`). At the pin the winner's folders move into `components/sections/` with their lines; a loser's leave the
tree, and its `prototype.json` names them and the commit that keeps them (`sections`, `sectionsAt`) — read one back with
`git show <sectionsAt>:"app/[lang]/(protectedLayer)/prototypes/_pages/<id>/sections/<kind>/index.tsx"`. The archive `../_archive/`
holds no code.
