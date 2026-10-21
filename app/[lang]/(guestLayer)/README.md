# `(guestLayer)` — the guest branch

Not a route of its own: a route group. Inside — one branch, `guest/` (`/<lang>/guest`), for visitors who must be someone
in the database without signing in: a visitor who opens it becomes a guest automatically (owner's word, node step 314-2:
«users who came to this page were automatically registered under a guest account»).

## When to use it

- The page needs a person, not a session-less visitor: saving a cart, a draft, a vote, progress — before any sign-in.
- The page is **not for search**: the branch is closed with `robots: noindex` (every visitor has their own session).
- Not for pages every visitor may read → `(publicLayer)`. Not for pages behind a role → `(protectedLayer)`.

## How the lock works

`guest/layout.tsx` wraps the branch in `_components/guest-gate.client.tsx`. In the browser it asks `/api/me`:

- session exists → the page is shown;
- no session → the browser goes to the site's own `/guest-in?redirectUrl=<this page>`, and `proxy.ts` sends it where a guest
  is made (node step 331): on the element's own domain — the node's sign-in centre (`/api/auth/sso?…&guest=1`), which
  creates the guest and returns a one-time code to `/api/auth/callback` (ticket cookie, as for «Sign in», step 328);
  anywhere else — the sign-in service's `/api/auth/guest` by the same address rule as `/login`. A user with the role
  `guest` is created, and the visitor comes back here;
- back here and still no session → the page says so (`gate.failed`) and **does not go again**: one attempt per tab
  (`sessionStorage` mark `guest-login-tried`), otherwise every circle would create one more guest in the database.

## The root page: «Go back» and «Delete my account and leave» (node step 331-2)

the sequence of `guest/_data/<lang>.json` ends with the widget `widget-static-guest-account` (`guest/_widgets/static/widget-static-guest-account/`); its words are the field `account` in
`guest/_data/<lang>.json`.
- **Go back** returns the visitor to the page they came from (a cart, a chat): `?from=<path>` in the address first, then the
  path the lock remembered before leaving for the sign-in (`sessionStorage` `guest-came-from`, same site, not the guest
  branch, not `/api/*`), then the home page. A page that sends a visitor here may add `?from=` itself.
- A signed-in member (not a guest) opening the page sees `account.notGuest` and «Go back» only — no delete (331-7).
- **Delete my account and leave** — after a confirmation: `POST /api/auth/guest-leave` (same-site `Origin` only). The server
  finds the guest by the session itself, the sign-in service deletes the record over the loopback
  (`/api/auth/guest/leave` — guests only, their sign-in tickets end on every domain), the site's cookies are cleared, and
  the browser goes to google.com.

The decision is taken in the browser; the server does not read the session, so the pages stay static. The lock's words
are the field `gate` (`signingIn`, `failed`) in `guest/_data/<lang>.json`.

## Under which conditions it works (node step 331)

| Where the element is opened | Where the guest is made | Works |
|---|---|---|
| a subdomain of the node's zone (`<id>.<zone>`) | `auth.<zone>/api/auth/guest` — its cookie is on the zone | yes |
| the element's own domain (step 324) | the node's centre with `guest=1` → code → ticket cookie of this site | yes |
| the node machine (`localhost`) | nowhere: the owner at the machine is recognised by the owner rule and never meets the lock | — |

The browser does not know the node's sign-in port or centre; the proxy does. Never send the lock to a sign-in address
built in the browser.

## The rule of the frame

The branch grows only inside its frame: `guest/layout.tsx` + `guest/page.tsx`, one `guest/[slug]/page.tsx`, and pages as
data folders in `guest/_pages/` — see `guest/README.md`. `scripts/check-routes.mjs` fails the build on any other route file.
