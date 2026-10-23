# `/<lang>/admin/blocks` — the blocks of this element

The page lists every block a page of this element may name (node step 577-11, owner 2026-10-23: «чтобы можно было перейти и увидеть
какие блоки уже существуют в этом элементе»). The architect opens it from the right menu, «Blocks of this element».

## Where the blocks are

| What | Where |
|---|---|
| the code of a block | `components/blocks/<block>.tsx` (+ `<block>.card.json` when it came from the catalogue) |
| the blocks a page may name | `BLOCK_SET` in `lib/content/blocks/registry.tsx` — the rows of this table |
| the shape of its data | `lib/content/blocks/types.ts` |
| its text in the copy for agents | `lib/aio/blocks-to-markdown.ts` |
| what came from the catalogue, at which version | `components/blocks/.blocks-lock.json` (written by `npm run blocks -- add`) |

## The table

Widget `_widgets/static/widget-static-element-blocks/`: `rows.ts` reads the files above and the page data of the element
(`app/[lang]/**/_pages/**`, `_data`) — there is no second list. Columns: block · Preview · description (the block's card, else
`components/blocks/README.md`) · origin (catalogue vN or template) · where it stands.

Preview — `/<lang>/admin/blocks/<block>` (`../../blocks/[name]/page.tsx`): breadcrumbs and the one block, drawn with the data of
its first place on a page of this element, else with the first case of its card; neither — the page says so.

## To add a block

Skill `use-blocks`: `npm run blocks -- find "<need>"` → `show` → `add`. It appears here with the next build.
