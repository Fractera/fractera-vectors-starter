# dialogs — Dialogs

Russian title: «Модальные окна». Order: 14.

This folder is for the blocks of the section «Dialogs»: A window over the page that interrupts for one question or one piece of reference, and says how it closes.

It holds no code. The code of every block is in `components/blocks/`; a block belongs here when the first entry of `categories` in its card (`components/blocks/<block>.card.json`) is `dialogs`. It comes with `npm run blocks -- add <block>` (skill `use-blocks`). Its page: `/<lang>/admin/blocks/dialogs`; the preview of one block: `/<lang>/admin/blocks/dialogs/<block>`.
