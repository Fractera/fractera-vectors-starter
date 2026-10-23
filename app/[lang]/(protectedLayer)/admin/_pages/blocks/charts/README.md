# charts — Charts

Russian title: «Диаграммы». Order: 13.

This folder is for the blocks of the section «Charts»: Numbers shown as a picture: how a value moved over time, how a whole splits into parts, how several measures compare at once.

It holds no code. The code of every block is in `components/blocks/`; a block belongs here when the first entry of `categories` in its card (`components/blocks/<block>.card.json`) is `charts`. It comes with `npm run blocks -- add <block>` (skill `use-blocks`). Its page: `/<lang>/admin/blocks/charts`; the preview of one block: `/<lang>/admin/blocks/charts/<block>`.
