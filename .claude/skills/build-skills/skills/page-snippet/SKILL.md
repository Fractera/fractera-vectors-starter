---
name: page-snippet
description: >
  Builder skill. Every public page of this Fractera element has its own social snippet — a 1200×630 picture with the page title in
  large letters, the description in small letters and the project background behind, tinted with the design's primary colour — at
  `/<lang>/<page>/snippet.png`, drawn on the first request with no rebuild. Load it whenever a task adds a page, a branch, a
  document or a post; whenever the person mentions a snippet, a preview, og:image, a social card, a cover or «how the link looks
  in Telegram»; whenever the project has no `public/images/snippet/background.webp` and the person wants one; and before you
  report that a new page is finished. The thing you cannot guess: the snippet is not a file you create — it is a route next to the
  page, and a page you add without that route falls back to a picture with no words.
  Russian phrasings of the person: «сниппет», «превью ссылки», «картинка для соцсетей», «обложка страницы», «фон для сниппета».
---

<!-- PROOF · PROVEN 2026-10-12 after a fix (the background line) · report: development-docs/proofs/2026-10-12-six-skills.md (in roman) -->

# page-snippet

> A hint, not a law. If you know a better way for the case in front of you, do it and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## What exists

| Piece | Where | What it does |
|---|---|---|
| the function | `lib/snippet/render.mjs` → `renderSnippet({ title, description, background, root, colors? })` | PNG 1200×630: title (bold, wraps by words, smaller when long), description (≤ 3 lines), background, a shade in the theme background on the left, a glow and a bar in `primary`. Colours — the dark palette of `DESIGN-CONFIG` only |
| the response | `lib/snippet/page-snippet.ts` → `snippetResponse(title, description)`, `snippetPath(subPath)` | reads the background, answers `image/png`; an empty title answers 404 |
| the routes | `<page folder>/snippet.png/route.ts` — next to `index.md/route.ts` | home and every `_pages` child (a `docs` branch, where it exists, has its own two). `revalidate = 300`, `dynamicParams = true`, empty `generateStaticParams`: drawn on the first request, kept like the page |
| the meta | `lib/branch-page.tsx` `ogImageOf` → `meta.ogImage = /{lang}/<path>/snippet.png` | og:image, twitter and JSON-LD of the page point to its own snippet. An own image in `meta.json` → `ogImage` still wins |
| the background | `public/images/snippet/background.webp` | one per project; missing → a pattern in the design colours |
| the background script | `scripts/snippet-background.mjs` | `--prompt "<customer's words>"` (OpenAI Images) or `--pattern` (free); never overwrites without `--force` |

Fonts: Inter from `@fontsource/inter` (`.woff`; satori does not read `.woff2`). Each subset carries its own name — under one name
the Cyrillic letters came out as «NO GLYPH».

## A new page or branch

1. A page inside an existing branch needs nothing: its `snippet.png` is the branch route.
2. A NEW branch (a new route root) gets `snippet.png/route.ts` next to its `page.tsx` and `index.md`, plus a line in
   `scripts/check-routes.mjs` ALLOWED. Copy the `[slug]` one; take the title and description from the same source the page uses.
3. The page's `meta.ogImage` → `snippetPath(subPath)`. Never `/og-default.png` for a public page.

## The background — ask first, then make it

If `public/images/snippet/background.webp` is missing and the person wants a real background (not the pattern):

1. **Ask what they want**: subject, mood, colours. Their words go into `--prompt` as they said them.
2. **Name the price before the call.** `POST /v1/images/generations`, model `gpt-image-2.5-flare`, `1536x864`, quality `medium`
   by default. Image output is $30 per 1M tokens (OpenAI pricing, checked 2026-10-12); the per-image token count for 2.5 is only in
   the calculator of the image-generation guide — for earlier models a 1536×1024 image took 1568 tokens at medium (~$0.05) and
   6208 at high (~$0.19). Say «about five cents at medium» and that the exact figure is in OpenAI's calculator.
3. Run `node scripts/snippet-background.mjs --prompt "<their words>"`. The script adds «no text, calm darker left half» itself.
4. Look at the result (open the file), then open one page's `snippet.png` and look at the title on it.
5. No key, or they do not want to pay → `node scripts/snippet-background.mjs --pattern`.

The background is read from the element folder at every draw (`lib/snippet/page-snippet.ts` → `elementRoot()`): it reaches the
site with no rebuild, as soon as the 5-minute cache of each snippet runs out (measured in node step 458). Corrected in node step 464:
the skill used to say «with the next deploy», and an agent repeated it.

## Prove it

- `curl -s -o /dev/null -w '%{http_code} %{content_type}' <site>/<lang>/<page>/snippet.png` → `200 image/png`; a page that does not
  exist → 404 (control).
- The page HTML: `og:image` content ends with `/<lang>/<page>/snippet.png`; `og-default.png` count is 0 on public pages.
- Open the PNG and read it with your eyes: the title is readable in every language of the page, the tint is the design's colour.

## Never

- Draw the title into the background image (the background has no text; the function writes the words).
- Put a colour into the code — colours come from `DESIGN-CONFIG`.
- Create PNG files per page in `public/` — a page added without a rebuild would have none.
