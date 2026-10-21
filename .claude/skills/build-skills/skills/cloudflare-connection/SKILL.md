---
name: cloudflare-connection
description: >
  Builder skill. How this Fractera node reaches the internet through Cloudflare — the tunnel from the home computer, the temporary address of
  the first start, the person's own domain with a subdomain per element, the copy of public pages in Cloudflare Workers — what it
  gives and what it limits. Load it whenever the person asks about the internet, the address of the site, a domain, HTTPS,
  Cloudflare, «why is my site not opening», error 1016/1033/530, «is it safe», «does it cost money», and before you explain where
  this element can be reached. The thing you cannot guess: there is no server of ours in the path — the person's computer is the
  server, Cloudflare carries it out through an outbound tunnel, and everything about the address is set on the core's pages, not
  in this element.
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# cloudflare-connection

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## How it works

- **The tunnel.** `cloudflared` on this computer opens an **outbound** connection to Cloudflare (`--protocol http2`); visitors
  reach the site through it. No open port, no router setup, HTTPS by Cloudflare, nothing to pay.
- **First start — a temporary address** (skill `temporary-domain`): the node goes on the internet by itself at a free
  `*.trycloudflare.com` address that points at the core's panel.
- **Later — the person's own domain:** «Domain and hosting → Domain activation» in the core. The domain sits in a free Cloudflare
  account; the page helps the person create a Cloudflare key with exactly the rights needed (the «Node key» card) and connects
  a named tunnel. Then: the main site at the domain, each element at `<address>.<zone>` (this one too), sign-in at `auth.<zone>`,
  the panel at `architect.<zone>`; an element may also get a domain of its own on its page.
- **The copy of public pages** — with the own domain, each address keeps a copy of its public pages in the person's Cloudflare
  Workers: while the computer is off Cloudflare serves it (skill `computer-off`). Refreshed only by a person's action: «Accept»,
  «Deploy», connecting a domain, «Refresh copies» on «Domain activation».

## What it gives

No server to rent, no port forwarding, HTTPS, the person's own domain, pages that stay up while the computer sleeps — and no
single point of failure of Fractera: if Fractera disappeared tomorrow, nothing stops for the person.

## What it limits

- Every action in Cloudflare goes through the core's screens with the person's key — you never ask the person to click in
  Cloudflare's own dashboard, and you never handle the key.
- Workers Free: 100 000 requests a day; past that the route fails open to the tunnel — a refusal, never a bill.
- The copy is a snapshot: a text edited after the last «Accept»/«Deploy» is not in it.
- Some providers slow Cloudflare (Russia since 2025-06-09, per Cloudflare's blog) — say so from that source, not as a ban.

## Where to send the person

The core's «Domain and hosting → Domain activation»; the address of this element is in your passport (`npm run passport -- me`).
