# `_pages` of the account branch — its children, as data

Every folder here is one page at `/<lang>/account/<folder name>`. A folder named after a role also holds that role's pages: `<role>/<page>/` answers at `/<lang>/account/<role>/<page>` and is locked by the role with every role that inherits it (node step 402; `../README.md`, «Role folders»). There is no list of pages anywhere else:
the folder is the page, and it appears in the sitemap and in the map for agents by itself.

To find a page someone talks about, search the words they used in `*/<lang>.json` of this folder.

## Example — a page folder

```
app/[lang]/(protectedLayer)/account/_pages/<slug>/meta.json
{ "order": 30, "roles": ["buyer"] }

app/[lang]/(protectedLayer)/account/_pages/<slug>/en.json
{
  "title": "How to plant a watermelon",
  "description": "Planting, the first weeks and watering.",
  "keywords": "",
  "body": [
    { "kind": "section-head", "id": "planting", "title": "Planting" },
    { "kind": "text-p", "text": "Water the seedlings once, right after planting." }
  ]
}

app/[lang]/(protectedLayer)/account/_pages/<slug>/ru.json
{
  "title": "Как посадить арбуз",
  "description": "Посадка, первые недели и полив.",
  "body": [
    { "kind": "section-head", "id": "planting", "title": "Посадка" },
    { "kind": "text-p", "text": "Полейте рассаду один раз, сразу после высадки." }
  ]
}
```

The page answers at `/<lang>/account/<slug>`. Kinds — `section-*` (this element's sections, `components/sections/`), `text-*` (typography, `lib/content/text-set.tsx`), `widget-*` (this branch's `_widgets/index.tsx`), one sequence in every language (`lib/content/page-items.ts`); a missing kind is written in this element by its design pass
(`components/sections/README.md`).
`roles` adds roles to the lock of the page (inside a role folder the folder's role and its heirs are already there); `{roles}` in a paragraph prints the whole list. The architect always passes.
