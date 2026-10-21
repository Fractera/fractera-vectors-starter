# `_pages` of the finance branch — its children, as data

Every folder here is one page at `/<lang>/finance/<folder name>`. A folder named after a role also holds that role's pages: `<role>/<page>/` answers at `/<lang>/finance/<role>/<page>` and is locked by the role with every role that inherits it (node step 402; `../README.md`, «Role folders»). There is no list of pages anywhere else:
the folder is the page, and it appears in the sitemap and in the map for agents by itself.

To find a page someone talks about, search the words they used in `*/<lang>.json` of this folder.

## Example — a page folder

```
app/[lang]/(protectedLayer)/finance/_pages/<slug>/meta.json
{ "order": 30, "roles": ["finance"] }

app/[lang]/(protectedLayer)/finance/_pages/<slug>/en.json
{
  "title": "How to plant a watermelon",
  "description": "Planting, the first weeks and watering.",
  "keywords": "",
  "blocks": [
    { "kind": "block-section-head", "id": "planting", "title": "Planting" },
    { "kind": "text-p", "text": "Water the seedlings once, right after planting." }
  ]
}

app/[lang]/(protectedLayer)/finance/_pages/<slug>/ru.json
{
  "title": "Как посадить арбуз",
  "description": "Посадка, первые недели и полив.",
  "blocks": [
    { "kind": "block-section-head", "id": "planting", "title": "Посадка" },
    { "kind": "text-p", "text": "Полейте рассаду один раз, сразу после высадки." }
  ]
}
```

The page answers at `/<lang>/finance/<slug>`. Kinds — `block-*` (the block set), `text-*` (typography, `lib/content/text-set.tsx`), `widget-*` (this branch's `_widgets/index.tsx`), one sequence in every language (`lib/content/blocks/types.ts`); a missing kind is taken from the Blocks
element (`npx shadcn add @fractera/<name>`).
`roles` adds roles to the lock of the page (inside a role folder the folder's role and its heirs are already there); `{roles}` in a paragraph prints the whole list. The architect always passes.
