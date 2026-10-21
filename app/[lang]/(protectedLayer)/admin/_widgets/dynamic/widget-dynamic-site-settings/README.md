# Site settings — `admin/_widgets/dynamic/widget-dynamic-site-settings/`

The element's own «Site settings» page (`/<lang>/admin/site-settings`): basics, SEO, meta and media, the site's languages and
the languages open to search engines. The islands talk to one door, `GET/PATCH /<lang>/admin/api/settings/app` (JSON merge patch into
the element's `APP-CONFIG/app-config.json`); it saves only while the link to CONFIG is off (otherwise 409 `config-connected`).

## Languages of the site — `languages-editor.client.tsx`

Which languages the site is built in and which one opens first. Saved as APP-CONFIG `languages: { supported, default }`;
the node's installer writes them into `NEXT_PUBLIC_SUPPORTED_LANGUAGES` / `NEXT_PUBLIC_DEFAULT_LOCALE`, so they reach the
site only after a new build (the element's «Deployments» page in the core — Preview or Deploy).

## Languages for search engines — `search-languages.client.tsx` (node step 340)

People see the site in every language above; search engines only in the open ones:

- **English and the default language are always open** — they cannot be closed here.
- **Any other language is unlocked by the person, one at a time, at their own risk** (confirmation inside the block) and
  can be closed again. Saved as APP-CONFIG `languages.indexed` (only the unlocked ones) → the node writes
  `NEXT_PUBLIC_INDEXED_LANGUAGES` into the build.
- «Waiting for deployment» appears while the saved set differs from the built one, with «Start a new deployment» leading to
  this element's Deployments page in the core (`ARCHITECT_URL` + passport id (`OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json`); no address — no button).

Connect it — it is already on the page: `index.tsx` passes the built set, the words and the Deployments address to
`LanguagesIsland`, which renders `LanguagesEditor`, which renders `SearchLanguages` under its Save button:

```tsx
<LanguagesIsland
  catalogue={catalogue}
  built={langs}
  builtDefault={def}
  builtUnlocked={(process.env.NEXT_PUBLIC_INDEXED_LANGUAGES ?? "").split(",").filter(Boolean)}
  ui={groupsUi(lang)}
  search={searchLanguagesWords(lang)}
  deployHref={deploymentsHref(lang)}
  words={w.access}
/>
```

When a change reaches the site: after a new deployment. Every published page then changes its robots tag, the sitemap and
the hreflang map at once — all three ask `isIndexable()` in `lib/seo/translation-state.ts` (open AND translated).

## Extending

- Words: `search-languages.i18n.ts` (en + ru). The advice is the owner's wording; «every six months» is a recommendation,
  not a Google rule — do not attribute it to Google.
- The rule itself lives in one place: `INDEXED_LANGUAGES` (`config/translations/translations.config.ts`) and
  `isIndexable` / `indexableLanguages` / `alternatesLanguages` (`lib/seo/translation-state.ts`). Never compute
  «indexable» elsewhere — `scripts/check-seo-html.mjs` (rules 9–13) fails the build on a disagreement.
- 🛑 Never close a language in `robots.txt` (Google reads `noindex` only on pages it may crawl) and never unlock a language
  on your own — it is the person's decision.

## What it cannot do

Choose a region by traffic (no analytics), submit the sitemap to Search Console, or run the deployment by itself — the
person presses Preview/Deploy.

## Removing

Delete `search-languages.*` and the `search` / `deployHref` props in `languages-island` / `languages-editor` / `index.tsx`.
Without `NEXT_PUBLIC_INDEXED_LANGUAGES` the site keeps English + the default language open.

## Proven by

Node step 340: builds of the template with the default set (`/ru` noindex, no hreflang, no `/ru` in the sitemap) and with
`ru` unlocked (reciprocal hreflang, 11 `/ru` rows); the door writes `languages.indexed` and keeps `supported`/`default`;
aifa.dev measured with `check:index` before and after. The screen itself was not seen by the agent (the browser froze) —
checked by the owner.
