---
name: own-domain-sign-in
description: >
  Builder skill. How sign-in works when THIS element lives on its own domain (for example mybrand.com), and what to tell the person. Load it
  when the person asks «why did sign-in send me to another address?», «Google sign-in does not work on my domain», «I want sign-in
  right on my domain», «sign-in shows an error 525 / a strange address», or after connecting an own domain (skill
  connect-own-domain, last step). The thing you cannot guess: the jump to the node's sign-in center (auth.<node zone>) is the
  design, not a fault — every provider (Google and others) is set up for that one address, so any new domain works at once; and a
  sign-in that goes to auth.<own domain> or auth.<element subdomain> means this element did not read its .env.local.
---

<!-- PROOF · NOT PROVEN yet: written 2026-10-11 (step 446-4), never checked by a live run -->

# own-domain-sign-in

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## How it works

- On its own domain the element does **not** run sign-in itself. «Sign in» / «Sign up» go to the node's sign-in center
  `https://auth.<node zone>/api/auth/sso` (node zone — `primary.name` in `GET $CORE/api/domain/list`); the center signs the person
  in and sends a one-time code back to `https://<own domain>/api/auth/callback`, which sets this site's own ticket. The address
  bar shows the center for a moment and comes back.
- Accounts are the node's: one person, one account on every domain of the node. On a new domain the person signs in once more
  (each domain has its own cookie), never registers again.
- On the element's subdomain (`<address>.<node zone>`) sign-in goes to `auth.<node zone>` directly.

## Why it is built this way — say it in these words

Google and the other providers accept sign-in only on addresses registered with them. The node registers one —
`auth.<node zone>` — so any own domain works the minute it is connected, with nothing to set up at Google.

## «I want sign-in right on my domain, without the other address»

Possible, not supported automatically, **not recommended**. The person would have to:
1. connect and set up every provider again for this domain — at Google: authorized redirect `https://<domain>/api/auth/callback/google`
   and the domain itself;
2. rework: `proxy.ts`, `lib/runtime-urls.ts`, `app/api/auth/callback/route.ts` (this element);
   `WEB4-ITEMS/core/auth/lib/auth/auth.config.ts` (providers); `lib/domain/public-auth.cjs` in the core (cookies and allowed origins
   of the sign-in service).
The same text stands on the core page «Settings → Domain», orange card «Sign-in on your own domain» — send the person there.

## Check that sign-in is alive

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://<own domain>/login?lang=en"
```

- `307 → https://auth.<node zone>/api/auth/sso?return=https://<own domain>/api/auth/callback…` — correct.
- `307 → https://auth.<own domain>/…` or `https://auth.<element subdomain>/…` (error 525 for the person) — **this element did not read
  its `.env.local`**: its process carries the core's `__NEXT_PROCESSED_ENV`. Do not change code. In the core folder run
  `npm run check:process-env`; it names the process. The cure is a clean restart, done by the person or with their «yes»:
  `pm2 delete fractera-svc-<id>`, `pm2 start ecosystem.config.cjs --only fractera-svc-<id>`, `pm2 save` from a plain terminal.
  (Measured 2026-10-11 on a sample element: born by the core's door, it kept that marker for six days.)
