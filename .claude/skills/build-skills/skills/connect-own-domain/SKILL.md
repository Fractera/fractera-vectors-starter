---
name: connect-own-domain
description: >
  Builder skill. Connecting the person's own domain to THIS element when they ask in chat: «connect my domain», «I bought mybrand.com»,
  «put my site on mybrand.dev», «подключи мой домен». You lead the whole way in the conversation: the person buys the domain and
  opens their registrar; you add the domain to the node and get the two Cloudflare name servers through the node's doors; you
  guide (or, with a browser, fill) the name-server change at the registrar; you measure until the domain is active and attach it
  to this element. The thing you cannot guess: everything on the Cloudflare side is done by the node's own doors with the node's
  key — you never hold the key and never send the person to Cloudflare's dashboard; and an OLD domain whose name servers change
  can take hours, so after ~5 minutes of old name servers you say so and suggest coming back in 3–4 hours.
---

<!-- PROOF · NOT PROVEN yet: written 2026-10-11 (step 444-1), never checked by a live run -->

# connect-own-domain

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## What you never do

- **Buy** the domain or **pay** for anything — the person buys it.
- **Type a password** or sign in for the person — they sign in to their registrar themselves.
- **Press «Save»** on the registrar's name-server form before the person writes «yes» in this chat. Changing name servers is a
  change to their account; fill the fields, show what you filled, wait for «yes».
- **Touch the node's own domain** (the main zone of the node, «Domain activation» ladder). An element's domain is an
  *extra* domain of the node; the node's main domain is never changed from here (step 443: doing so took the panel down).
- **Set a timer** to come back. «Come back in 3–4 hours» is advice to the person, not a wake-up.

## The doors (core of this node, from this computer)

The core's address is not remembered — read it:

```bash
node -e "const f=require('fs'),p=require('path');const e=f.readFileSync('.env.local','utf8').match(/^NODE_DOMAIN_FILE=(.*)$/m)[1].trim();const r=JSON.parse(f.readFileSync(p.join(p.dirname(p.dirname(e)),'logs','runtime.json'),'utf8'));console.log('http://'+(r.hostname||'localhost')+':'+r.port)"
```

This element's id — the last folder of `SERVICE_DATA_DIR` (works in every element; older ones have no `npm run passport`):

```bash
node -e "const f=require('fs'),p=require('path');console.log(p.basename(f.readFileSync('.env.local','utf8').match(/^SERVICE_DATA_DIR=(.*)$/m)[1].trim()))"
```

Below, `$CORE` is the core address, `$ID` this element's id.
The doors open from this computer without sign-in; on a temporary public address they refuse (`temporary-address`).

| Door | What it does | Answer |
|---|---|---|
| `GET $CORE/api/domain/list` | the node's domains | `{ key:{present,status}, primary:{name}, extra:[{name,state,holder,…}] }` |
| `POST $CORE/api/domain/list {"name":"<d>"}` | add an extra domain + first measurement | `{ ok, domain }` or `{ ok:false, error }` |
| `POST … {"name":"<d>","action":"create-zone"}` | the node creates the zone in the person's Cloudflare | `{ ok, domain:{ nameServers:[2] } }` |
| `PUT $CORE/api/domain/list {"name":"<d>"}` | measure again | `domain:{ state, status, nameServers, registrarNs, nsMatch, activationAsked, registrar }` |
| `POST $CORE/api/architect/items/$ID/domain {"name":"<d>"}` | attach the domain to this element | `{ ok }` or `{ ok:false, error:"not-in-list" \| "taken" … }` |

`state`: `active` — Cloudflare serves the zone · `pending` — zone exists, waits for name servers · `not-visible` — no zone in the
key's account yet · `unknown` — not measured. `nameServers` — the two Cloudflare names; `registrarNs` — what the public DNS says
right now; `nsMatch` — they agree (then the node asks Cloudflare to re-check by itself: `activationAsked`).

Errors of «add»: `bad-shape` (not a domain), `with-www` (give the root, no `www.`), `primary` (that is the node's main domain),
`exists` (already in the list — just measure it). Errors of «create-zone»: `no-key` (the node has no Cloudflare key — send the
person to «Domain and hosting → Domain activation», card «Node key»), `no-zone-permission` (the key lacks the zone right — same
card, «Update key»), `bad-account-id` / `no-account`.

## The conversation

1. **Which domain.** Ask for the name. No domain yet → ask them to buy one at any registrar (it is the only part that costs money)
   and to come back with the name.
2. **Add and measure.** `POST` add, then read `domain.state`:
   - `active` → the zone already works in their Cloudflare: go to step 6.
   - `not-visible` → `create-zone`; you now have the two `nameServers`.
   - `pending` → the zone exists; take its `nameServers`.
3. **The registrar.** Ask the person to sign in to their registrar and send the link of the domain's page. Tell them who the
   registrar is if `registrar` is known. Give the two names exactly, one per line.
4. **Change the name servers.**
   - With a browser (tools `mcp__claude-in-chrome__*` present): open the link in a new tab, find the name-server section
     (Nameservers / NS / DNS), switch to custom, put the two names, **stop and ask «save?»**; save after «yes».
   - Without a browser: describe the step in plain words, or ask for a screenshot of their page and point at the field. Never
     describe a registrar screen you have not seen.
5. **Measure for up to ~5 minutes.** `PUT` once a minute while the person is in the conversation.
   - `nsMatch` true → say «the name servers are in place; Cloudflare is confirming» and keep measuring until `state` is `active`.
   - after ~5 minutes `registrarNs` still shows the OLD servers → this domain lived before and its old name servers are cached
     across the internet; that takes hours, not minutes. Say exactly that and suggest coming back in 3–4 hours: when the person
     writes again, start from step 5.
6. **Attach.** `POST $CORE/api/architect/items/$ID/domain`. Then tell the person the address and that the old subdomain now
   leads to the domain. Which address is the *main* one (subdomain or domain) they choose in «Settings → Domain → Main
   mirror»; do not decide for them.
7. **Check what a visitor sees.** `curl -s -o /dev/null -w "%{http_code}" https://<d>/` — 200 means it opens; say the number.
8. **Check sign-in and the agent card.** Sign-in: skill `own-domain-sign-in` («Check that sign-in is alive») — the answer must lead to
   `auth.<node zone>/api/auth/sso`. Agent card: `curl -s -o /dev/null -w "%{http_code}" https://<d>/.well-known/agent-card.json` — 200 if this
   element has the A2A layer; 404 means the element has no card at all (not a domain fault) — say so.

## When the domain does not open although the node says it is fine

- **The person is in Spain and it is a match day.** Not a cache and not Cloudflare: the access providers themselves refuse
  connections to listed IP addresses. Spanish ISPs (Movistar, Orange, Vodafone, DIGI, mobile too) block Cloudflare IP
  addresses during LaLiga broadcasts; a domain that shares such an address stops opening in Spain for hours. Measured 2026-10-11:
  a sample element domain (188.114.96.5, 188.114.97.5) hung on TCP from Spain while it answered 200 from outside. Check, do not guess:
  `curl -s https://hayahora.futbol/estado/blocked-any.txt | grep <IP of the domain>` (the domain's IPs: DNS `A` record). A hit
  means it is not the node. Advice: wait until the matches end or use a VPN; the address cannot be chosen on Cloudflare Free.
- **The name servers were moved to ANOTHER Cloudflare account.** `PUT` shows `status: "moved"`, `nsMatch: false`, and
  `registrarNs` differ from `nameServers`. The node's key belongs to the old account and cannot see the new zone. Say so and
  offer two ways: give the node a key of the new account (core «Domain activation» → card «Node key»), or put back the old name
  servers. A zone in the new account without our tunnel answers visitors with Cloudflare error 1000 «DNS points to prohibited IP».
- **The change is made but the internet still shows the old name servers.** Resolvers (the ISP's, Google, Cloudflare 1.1.1.1)
  keep each answer no longer than its TTL counted from the moment THEY fetched it, so each one has its own remainder between zero
  and the TTL — usually the switch is much faster than the limit; the TTL is a maximum, not a waiting time. Measured for a sample domain
  2026-10-11: `NS` — 1.1.1.1 up to 24 h (TTL 86400), Google up to 6 h (21600); the site's `A` record — 5 min (300). Cloudflare's
  own resolver can be refreshed at once: https://one.one.one.one/purge-cache/ (type `NS`, then `A`); Google's resolver has
  its own page; ISP caches cannot be purged. The registry is the truth: `nslookup -type=NS <domain> <TLD name server>`.

## Example (the domain is already active in Cloudflare)

```bash
CORE=http://localhost:24680; ID=<this element id, OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json>
curl -s -X POST $CORE/api/domain/list -H 'content-type: application/json' -d '{"name":"mybrand.com"}'
curl -s -X PUT  $CORE/api/domain/list -H 'content-type: application/json' -d '{"name":"mybrand.com"}'   # state: active
curl -s -X POST $CORE/api/architect/items/$ID/domain -H 'content-type: application/json' -d '{"name":"mybrand.com"}'
curl -s -o /dev/null -w "%{http_code}\n" https://mybrand.com/
```
