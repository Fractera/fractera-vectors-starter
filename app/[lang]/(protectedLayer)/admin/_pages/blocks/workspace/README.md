# workspace — Workspace

Russian title: «Рабочий экран». Order: 12.

This folder is for the blocks of the section «Workspace»: A working screen rather than a page to read: a menu on the left, content on the right. This is what dashboards and project tools are built from.

It holds no code. The code of every block is in `components/blocks/`; a block belongs here when the first entry of `categories` in its card (`components/blocks/<block>.card.json`) is `workspace`. It comes with `npm run blocks -- add <block>` (skill `use-blocks`). Its page: `/<lang>/admin/blocks/workspace`; the preview of one block: `/<lang>/admin/blocks/workspace/<block>`.
