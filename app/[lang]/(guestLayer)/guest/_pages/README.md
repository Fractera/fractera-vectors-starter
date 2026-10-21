# `_pages` of the guest branch — its children, as data

Every folder here is one page at `/<lang>/guest/<folder name>`. There is no list of pages anywhere else:
the folder is the page, and it appears in the sitemap and in the map for agents by itself.

To find a page someone talks about, search the words they used in `*/<lang>.json` of this folder.

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

The page answers at `/<lang>/guest/<slug>`. Kinds — `block-*` (the block set), `text-*` (typography, `lib/content/text-set.tsx`), `widget-*` (this branch's `_widgets/index.tsx`), one sequence in every language (`lib/content/blocks/types.ts`); a missing kind is taken from the Blocks
element (`npx shadcn add @fractera/<name>`).
