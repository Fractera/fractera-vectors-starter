# `/<lang>/guest` — the guest branch

A branch of the element's frame (node step 314-2). Lock of the branch: no session → the sign-in service creates a guest and brings the visitor back (one attempt per tab); every guest is a record in the database.

## What is here

| Path | Role |
|---|---|
| `page.tsx` | the ROOT of the branch — `/<lang>/guest`, words in `_data/{meta,en,ru}.json` |
| `layout.tsx` | the lock of the branch |
| `[slug]/page.tsx` | the ONE child route — draws every folder of `_pages/` |
| `_data/` | the words of the root: `meta.json`, `en.json` (required), `ru.json` |
| `_components/` | required — the branch's own components (server by default, islands `*.client.tsx`); see its README |
| `_libs/` | required — the branch's own logic without markup; see its README |
| `_widgets/` | required — the branch's widgets, `static/<name>` · `dynamic/<name>`; see its README |
| `_pages/<slug>/` | the children — data only |


## The rule of the frame

This element is built on Next 16.2 and grows only inside its frame (`CLAUDE.md`, section «The frame»). A branch has
code only at its root: `layout.tsx` + `page.tsx`, and one `[slug]/page.tsx` that draws every child. **A new page is a
folder of data in `_pages/`, never a new `page.tsx`** — the build grows with the number of route files, not pages
(measured: 300 page files 1252 s, the same pages through one template 98 s). `scripts/check-routes.mjs` fails the build
on any route file outside its closed list. Skill: `.claude/skills/build-skills/skills/use-page-tree`.

Pages are static: the build draws only the roots; a child is drawn on its first visit and refreshed every five minutes
(`revalidate = 300`). Texts are JSON read at run time (`lib/page-tree.ts`, `ELEMENT_DIR`): a corrected paragraph shows
up within five minutes without a rebuild — or at once after `npm run pages:refresh`, which the agent runs after every
text change before telling the person the change is live. Every page has `en.json` (required) and `ru.json`; no visible string in code.

## Example — a page folder

```
app/[lang]/(guestLayer)/guest/_pages/<slug>/meta.json
{ "order": 30 }

app/[lang]/(guestLayer)/guest/_pages/<slug>/en.json
{
  "title": "How to plant a watermelon",
  "description": "Planting, the first weeks and watering.",
  "keywords": "",
  "blocks": [
    { "kind": "block-section-head", "id": "planting", "title": "Planting" },
    { "kind": "text-p", "text": "Water the seedlings once, right after planting." }
  ]
}

app/[lang]/(guestLayer)/guest/_pages/<slug>/ru.json
{
  "title": "Как посадить арбуз",
  "description": "Посадка, первые недели и полив.",
  "blocks": [
    { "kind": "block-section-head", "id": "planting", "title": "Посадка" },
    { "kind": "text-p", "text": "Полейте рассаду один раз, сразу после высадки." }
  ]
}
```

The page answers at `/<lang>/guest/<slug>`. Block kinds — `lib/content/blocks/types.ts`; a missing kind is taken from the Blocks
element (`npx shadcn add @fractera/<name>`).
