---
name: connect-google-analytics
description: >
  Builder skill. Connecting Google Analytics and Google Search Console to THIS element when the person asks: «add Google Analytics», «here is
  my Google tag G-…», «connect Search Console», «подключи аналитику», «добавь тег Google», or pastes the gtag.js snippet. Both are
  settings on the element's «Site settings» page, never code: the measurement ID turns the tag on every page at once, and the
  element by itself turns on the cookie banner and the footer with the Cookie and Privacy pages, where a Google Analytics section
  appears. The thing you cannot guess: a pasted snippet is never put into the code — only its ID goes into the settings; and the
  data is checked in the GA property whose web stream carries THAT ID — the account usually has several properties.
---

> A hint, not a law. You know a better way for the case in front of you — do it and say so.

**Process: build** — this skill changes the element as a thing: settings that change every page, a file in `public/`, a commit, a rebuild for the file; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## What the person gets

| They give | Where it goes | What turns on by itself |
|---|---|---|
| Google tag `G-XXXXXXX` (or the whole gtag.js snippet) | «Site settings» → «Analytics»: switch on + «Measurement ID» → «Save» (APP-CONFIG `analytics`) | the tag on every page, no rebuild · the cookie banner · the footer with the policy pages · the «Google Analytics» section on `/cookies` and `/privacy` |
| Search Console code (`google-site-verification` content) | «Site settings» → SEO → «Google verification» → «Save» (APP-CONFIG `seo.googleVerification`) | the meta tag in the head of every page · the footer with the policy pages |
| Search Console HTML file `google<hex>.html` | `public/` of this element, a commit, «Deploy» | the file at `https://<address>/google<hex>.html` |

One answer decides what turns on: `lib/policy-tools.ts` (`needsCookieBanner`, `needsPolicyPages`). Never add a second switch.

## Steps

1. Take the ID out of what they pasted (`G-` + letters and digits). Do not paste the `<script>` anywhere: `app/[lang]/layout.tsx`
   already draws it from the setting, with Consent Mode v2 — `denied` until the visitor presses «Accept».
2. Fill the setting through the page «Site settings» (the person's browser, or yours with their word) — the page saves and
   redraws the pages; no rebuild.
3. The public address shows the change only after the Cloudflare copy is refreshed: «Deploy» of this element, or «Refresh copies»
   on the core's «Domain activation». Say so — otherwise the person opens the site and sees no tag.
4. Search Console verifies only the address that serves THIS site. If the domain of the resource does not open this element
   (another Cloudflare account, name servers moving, error 1000/1016) — say it plainly and stop; verification will fail.

## How to check (both are needed)

- **The page:** `curl -s https://<address>/en | grep -o 'gtag/js?id=G-[A-Z0-9]*'` shows the ID; with the switch off — nothing.
  The footer shows Cookies · Privacy; `/en/cookies` has the «Google Analytics» section only while it is on.
- **Google:** in the browser open the site, press «Accept», open a second page. The request
  `region1.google-analytics.com/g/collect` carries `tid=<the ID>` and `gcs=G101` (before «Accept» — `G100`). Then GA →
  «Realtime» of the property whose «Data streams» show THIS measurement ID — active users and page titles appear in a minute.

## Mistakes already paid for

- Realtime «No data» was watched in the wrong property: the account had another property with stream `G-KM49…`. Open «Admin →
  Data streams» and compare the ID first.
- The browser extension marked `collect` as `503` while Google counted the visits — trust Realtime, not that status.
- A click of an automation tool on «Accept» missed the button (an overlay in the corner); the choice was not saved — check
  `localStorage['fractera-cookie-consent']`.
- The banner linked to `/<lang>/legal/cookies` (404) — the page lives at `/<lang>/cookies`.

## Never

- Write the tag, an ID or a verification code into code or a page file.
- Turn the cookie banner off while Google Analytics is on.
- Promise «Search Console is verified» before Google itself says so.
