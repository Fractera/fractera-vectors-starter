---
name: use-languages
description: >
  Builder skill. How languages work in this Fractera element — the catalogue of 82 languages it is ready for, the enabled set,
  the default language, the switcher, translations as files next to the base, the set open to search engines, and the
  translation debt. Load it before you write any text a visitor or the person will see, add a page, a widget or a dictionary,
  when the person asks about languages, translation, «make it in Spanish», the switcher, hreflang, «why is this page in
  English», indexing in another country — and before you advise how many languages to launch with. The thing you cannot
  guess: people see every enabled language, a search engine sees only the languages opened to it AND translated on that page;
  the strategy is one language while building and as few as possible at launch, and every postponed translation is a written
  debt.
---

<!-- PROOF · PROVEN 2026-10-07: loaded for «open ten languages», changed nothing, gave the strategy, asked · report: development-docs/proofs/2026-10-07-node-skills.md -->

# use-languages

> A hint, not a law: if you know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## What is there

| Layer | Where | What it means |
|---|---|---|
| catalogue | `config/translations/language-metadata.ts`, `NEXT_PUBLIC_ALL_LANGUAGES` | 82 languages (ISO 639-1) the element is ready for: native and English names, flags, regions, AI translation quality. A reference list, not the active set |
| enabled set | APP-CONFIG `languages.supported` → `NEXT_PUBLIC_SUPPORTED_LANGUAGES` | the languages the site serves at `/<lang>/…`. One language → no prefix and no switcher; two or more → the switcher (`components/shell/language-switcher.client.tsx`) appears |
| default | APP-CONFIG `languages.default` → `NEXT_PUBLIC_DEFAULT_LOCALE` | the base: every page exists in it; a page without its own translation answers in it |
| open to search | APP-CONFIG `languages.indexed` → `NEXT_PUBLIC_INDEXED_LANGUAGES` | English and the default are always open; the list adds the unlocked ones |

The person changes all of it on the element's page «Site settings» (`admin/site-settings`) or in the node's CONFIG when this
element takes its languages from CONFIG. The node's installer and «Preview» write the variables from APP-CONFIG. 🛑 They are
`NEXT_PUBLIC_*` — baked into the build: a saved change shows only after «Deploy»; the settings page says «waits for deployment»
until then.

## Translations are files

A translation is one more language file next to the base, in the folder of the route or widget that owns it (CLAUDE.md, «A
route owns its own»). Until it exists, the page answers in the default language. Never write a text into the code inline and
never `lang === 'ru' ? … : …`. The person's tools: the dialog `_tools/tool-translations-dialog` (automatic translation with the
node's OpenAI key, one language at a time) and `npm run i18n:export` → an outside model translates all languages at once →
`npm run i18n:import` — cheaper than translating prose in your own context.

## How the element protects itself from search penalties — built, not promised

- **No duplicate pages.** An enabled language without its own text still opens for people, but it gets `noindex`, is left out
  of `hreflang` and out of the sitemap (`lib/seo/translation-state.ts`: `isIndexable` = open ∧ translated; an empty
  translation `{}` counts as missing). Otherwise the search engine sees near-identical pages under different `lang` — a
  doorway.
- **Opening a language is the person's act.** On «Site settings → Languages for search engines» each extra language is
  unlocked one by one, with a confirmation «at your own risk». You never add a language to `indexed` yourself.
- **`robots.txt` never closes languages** — a page blocked there cannot show its `noindex` (Google, block-indexing).
- **Only the visitor's language reaches the browser** (`npm run check:lang-delivery`; client files must not import whole
  dictionaries).
- Guards: `npm run check:i18n` (dictionaries vs the enabled set), `check:seo` (source), `check:seo-html` rules 9–13 (built
  HTML), `npm run check:index <url> --langs …` (what the live site shows a robot now).

## What to recommend — say it in these words when languages come up

- **While building — one language.** Texts are rewritten several times; translating early is paid for twice. Build in the
  default language and write every postponed translation into `development-docs/translation-debt.md` the same day
  (format inside the file); the line is deleted by the same change that adds the translation.
- **At launch — the minimum that serves the audience**, usually English plus the site's language. Every extra indexed
  language multiplies the pages a search engine must trust, and mass automatic translation of little value is what Google's
  spam policy names «scaled content abuse».
- **Let the main version earn its place first — at least about half a year** of indexing on the base language(s), then open
  new languages to search gradually, **not more often than one per quarter**, each one fully translated and checked. People
  may still see more languages through the switcher meanwhile — that costs nothing in search.
- This is advice from the person's strategy, not a lock: the decision is theirs; name the risk and do what they choose.

## Do not

- Enable, open to search or remove a language without the person's word.
- Leave a visible string untranslated silently — either the translation file or a debt line.
- Promise that a saved language change is live before the element is deployed again.
