# page-material — Page material

Russian title: «Материал страницы». Order: 11.

This folder is for the blocks of the section «Page material»: What a page is written FROM: paragraphs, lists, quotes, tables, code, callouts.

It holds no code. The code of every block is in `components/blocks/`; a block belongs here when the first entry of `categories` in its card (`components/blocks/<block>.card.json`) is `page-material`. It comes with `npm run blocks -- add <block>` (skill `use-blocks`). Its page: `/<lang>/admin/blocks/page-material`; the preview of one block: `/<lang>/admin/blocks/page-material/<block>`.
