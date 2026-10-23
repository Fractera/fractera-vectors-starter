# pricing — Pricing and plans

Russian title: «Прайс и тарифы». Order: 7.

This folder is for the blocks of the section «Pricing and plans»: An honest view of prices, what each package holds and how payment works.

It holds no code. The code of every block is in `components/blocks/`; a block belongs here when the first entry of `categories` in its card (`components/blocks/<block>.card.json`) is `pricing`. It comes with `npm run blocks -- add <block>` (skill `use-blocks`). Its page: `/<lang>/admin/blocks/pricing`; the preview of one block: `/<lang>/admin/blocks/pricing/<block>`.
