---
name: use-machine-copy
description: >
  Builder skill. What every public page of this Fractera element gives to machines — search engines and AI agents — and how
  to keep it true: the Markdown copy of the page (`/<lang>/<page>/index.md`, linked from the page head), `llms.txt`,
  `llms-full.txt`, the sitemap, robots.txt and the A2A card. Load it whenever a task adds or changes a public page or a widget on
  it, adds a new block kind, or the person asks about SEO, AI search, llms.txt, «the text version of the page», markup in the
  head, or what agents see. The thing you cannot guess: a widget's words are NOT in the page's blocks — without its own
  `markdown.ts` they never reach the Markdown copy (the home page once gave agents 159 bytes in English while showing ~16 000
  characters), and the copy on the own domain changes only after «Deploy».
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# use-machine-copy

> A hint, not a law: if you know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## What every public page already gives — you do not build it again

| What | Where it comes from | Address |
|---|---|---|
| Markdown copy of the page | `lib/aio/surfaces.ts` → `blocksToMarkdown` (`lib/aio/blocks-to-markdown.ts`) | `/<lang>/index.md`, `/<lang>/<page>/index.md` |
| link to it in `<head>` | `lib/seo/alternates.ts` (`mdUrlFor`) | `<link rel="alternate" type="text/markdown" href="…">` |
| map for agents | `lib/aio/llms.ts`, from the same list of pages | `/llms.txt`, `/<lang>/llms.txt` |
| every page's full text in one file | the same list, the same copies | `/llms-full.txt` |
| sitemap, robots | `app/sitemap.ts`, `app/robots.ts` | `/sitemap.xml`, `/robots.txt` |
| canonical, hreflang, Open Graph, Twitter | `lib/construct-metadata.ts`, `lib/seo/alternates.ts` | page head |
| JSON-LD | `lib/jsonld.ts` | page head |
| A2A card | `app/.well-known/agent-card.json/route.ts` (`lib/a2a/card.ts`) | `/.well-known/agent-card.json` |

One source: the copy is built from the same data the page is drawn from — edit the words once, both forms change. A new
public page folder appears in all of these by itself; a page behind a role never does (`npm run check:aio`).

## Your part: every public widget brings its own text

A widget draws words that are not in the page's blocks (the landing's `landing` field, a form's labels). The builder of the copy
cannot see inside a widget, so the widget hands its text over:

1. `markdown.ts` in the widget's folder: `export function markdown(lang: string): string` — built from the **same source the
   widget renders** (its words file, its i18n strings), never a second copy of the text.
2. One line in the branch's `<branch>/_widgets/markdown.ts` (`WIDGET_MARKDOWN`), the pair of `_widgets/index.tsx`.
3. The builder calls it where the page's sequence has the `widget-*` block — the copy keeps the page's order.

Write only words from the data: headings `##`/`###`, paragraphs, lists, `**who:** text` for a dialogue, `[label](href)` for a
link. **No labels of your own** («Fields:», «Question:») — an English word in the Russian copy is a foreign language for the
reader. Leave out what is decoration (an image's scene, «turn the TV on»), keep what a person reads.

A widget with nothing to read (a pure animation, a map) says so in its `index.tsx`: `// @machine-text none: <reason>` — the
guard prints it as a warning instead of failing.

A new block kind in the registry → a `case` in `blocks-to-markdown.ts` in the same edit, or its text silently leaves the copy.

`npm run check:aio` fails on a public widget without `markdown.ts` and on one listed in `index.tsx` but not in `WIDGET_MARKDOWN`.

## A page that sells a service

A page that offers a service (a cleaning, a consultation, a repair) says so in its `meta.json` — the words stay in the language
files, here only what is not translated:

```json
{ "order": 20, "service": { "provider": "Maria", "areaServed": "Gran Vía, Madrid", "price": "30.00", "priceCurrency": "EUR" } }
```

The page then gets schema.org `Service` instead of `Article` (name and description — the page's title and description in its
language, the offer only when both price and currency are set) and `og:type` `website`. Everything is optional; no
`service` — an ordinary article. The provider is written as an organization with that name.

Given to every page without your work: `og:type` `website` on the home page and `article` on the others; breadcrumbs with the
current page as the last item (no link); FAQ markup from the block `faq` next to the visible questions; robots.txt lets search
and AI bots in, `Google-Extended` (whether Gemini learns from the pages; it does not affect Search) included — closing any of
them is the person's decision.

## When the person sees it

- On this computer: the Markdown route is built code — a new or changed `markdown.ts` shows after a build («Preview» →
  «Accept», or «Deploy»). Page data edits show at once.
- On the own domain the public pages come from the Cloudflare copy: the change reaches visitors and agents only after
  «Deploy», «Accept» or «Update copies» (skill `deploy-element`).

## How to check

- `curl -s http://127.0.0.1:<port>/<lang>/<page>/index.md` — the page's real text, in the page's language, every widget's words
  in their place; compare its size with the visible text of the HTML page.
- `curl -s http://127.0.0.1:<port>/llms-full.txt | grep -c "<a phrase from the widget>"` — the widget is in the full file too.
- The same on the public address after «Deploy» — `127.0.0.1` answering new and the domain old means the copy was not updated.
- Before reporting: `npm run check:aio`, spoiled once (move the widget's `markdown.ts` away → it must fail, put it back).

**Head and structured data — the order that proved itself (node step 431, 2026-10-07):**
1. Before «Accept», on the preview: the same page from the running build (`127.0.0.1:<port>`) and from the preview
   (`127.0.0.1:<preview port>` on «Deployments») — `<title>`, `meta description`, `og:type`, every `application/ld+json` block. The
   running build is the control: the change must be on the preview only.
2. A page kind the site does not have yet (a service page) is proven with a temporary page folder that is never committed — the
   preview builds the working tree; delete it and reject that preview before building the one to accept.
3. After «Accept» on the public address: the same fields, plus `robots.txt` and `/.well-known/agent-card.json` (skill
   `describe-element`).
4. Google Rich Results Test on the public address: `https://search.google.com/test/rich-results?url=<page address>` — every item
   «without errors». It shows only Google's own types (search gallery: developers.google.com/search/docs/appearance/structured-data/search-gallery):
   `Article`, breadcrumbs, `Organization` appear; `WebSite` and `Service` never do — that is not an error. Check those with the
   schema.org validator `https://validator.schema.org/`.

## Facts from the first source — do not add what does not exist

- Google, for AI Overviews and AI Mode: «You don't need to create new machine readable files, AI text files, or markup to appear
  in these features» (developers.google.com/search/docs/appearance/ai-features). The Markdown copy and `llms.txt` serve other
  agents, not Google's ranking.
- There is no `<link rel="agent">` (not in the IANA link relations) and no `schema.org/AgentPlatform` (the platforms are
  Android, DesktopWeb, GenericWeb, IOS, MobileWeb). The A2A card lives at `/.well-known/agent-card.json` (A2A v1.0), not
  `/.well-known/agent.json`.
- FAQ rich results in Google are shown only for well-known government and health sites; FAQ markup does not bring them here.
- Something new for the head or a new machine file → find its specification first and quote it to the person before building.
