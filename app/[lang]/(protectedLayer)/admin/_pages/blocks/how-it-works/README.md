# how-it-works — How it works

Russian title: «Как это работает». Order: 3.

This folder is for the blocks of the section «How it works»: A step-by-step explanation of the purchase, the interaction or the service.

It holds no code. The code of every block is in `components/blocks/`; a block belongs here when the first entry of `categories` in its card (`components/blocks/<block>.card.json`) is `how-it-works`. It comes with `npm run blocks -- add <block>` (skill `use-blocks`). Its page: `/<lang>/admin/blocks/how-it-works`; the preview of one block: `/<lang>/admin/blocks/how-it-works/<block>`.
