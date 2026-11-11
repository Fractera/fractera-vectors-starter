# widget-static-vectors-landing — the vector store's landing (node step 650-4)

The home page of the vector store, drawn after the Stripe sample (`fractera-stripe-starter`, `widget-static-stripe-landing`, step
573-7) like the memory's and the embeddings' landings, so the memory elements read as one family. The page is `bare`; this widget
draws it from the items of the page data (`(publicLayer)/_data/<lang>.json`): a part is `section-head` and the items up to the
next, its view chosen by its `id` (`route` beside the hero, `solves`, `spaces` with the section `section-access-map`, `connect`,
`hood`, `credits`), an unknown `id` drawn by the common view. Words live only in the data; the machine copy of the page comes from the
items (`lib/aio/page-to-markdown.ts`), so `markdown.ts` returns nothing. Claims only about what is built, checked against README.
