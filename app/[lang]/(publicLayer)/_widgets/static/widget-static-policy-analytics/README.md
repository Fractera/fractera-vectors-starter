# policy-analytics — the Google Analytics section of the policy pages

Pages: `(publicLayer)/_pages/cookies` and `(publicLayer)/_pages/privacy` name `widget-static-policy-analytics` in their sequence;
listed in `(publicLayer)/_widgets/index.tsx` and `_widgets/markdown.ts` (node step 449-2).

- **Drawn only while Google Analytics is on** — `lib/policy-tools.ts`, the same answer that turns the cookie banner and the
  footer with the policy pages on. Switched off in the site settings → the section is gone after the settings' redraw; the page
  stays static.
- **Words** — `words.ts` (en base, ru translation, other languages fall back to en); `{id}` is the measurement ID from the
  settings. Facts in them are about this element only: consent mode «denied» until «Accept» (`app/[lang]/layout.tsx`), the
  cookies `_ga` and `_ga_<container-id>` for 2 years (Google's documentation «Google Analytics cookie usage on websites»).
- **Markdown copy** — `markdown.ts`, the same words.
- Not here: the cookies the element sets itself (language, theme, width, sign-in) — they are plain text of the pages.
