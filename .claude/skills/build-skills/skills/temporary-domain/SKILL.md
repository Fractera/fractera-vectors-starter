---
name: temporary-domain
description: >
  Builder skill. The free temporary Cloudflare address a Fractera node gets on its first start — what it is for, why it cannot be a permanent
  link (not on a business card, not in an advert, not in a contract), what is closed on it, what to do when it stops opening,
  and why the person should switch to their own domain as early as possible. Load it whenever the person shares or asks about
  a `*.trycloudflare.com` address, «my link stopped working», error 1016/1033, «can I print this link», «why is there no
  sign-in», «why is the panel read-only», or asks about a domain. The thing you cannot guess: the address changes on every
  restart of the tunnel, and the node never replaces it by itself — a link already given away would silently die.
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# temporary-domain

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## What it is

On the first `npm run serve:start` the node opens a free quick tunnel and gets an address like
`https://<random words>.trycloudflare.com`, pointing at the core's panel — so the person sees their node from a phone at once,
with nothing to buy or set up (owner 2026-10-02).

## Why it is not permanent

- It lives as long as the tunnel: a restart, a crash or Cloudflare dropping the tunnel gives a **new** address; the old one
  answers Cloudflare error 1016/1033 for good. The site itself is intact on the computer.
- So it never goes on a business card, an advert, a QR code, a contract or a bookmark someone else keeps.
- On it the panel is **read-only and without sign-in** (a red bar says so); sign-in exists only on an own domain; there is no
  copy of pages for the time the computer is off (skill `computer-off`).

## When it stops opening

`npm run serve:status` measures whether the site is reachable now. `npm run serve:publish` brings it back (a new address if the
old one died); `-- --new` swaps it on purpose. The node never swaps it by itself (owner 2026-09-19: «do not touch it, only tell the
truth»).

## The way out — the own domain, early

Strongly advise it as soon as the person starts using the node for anything they share: «Domain and hosting → Domain activation»
in the core — a domain in a free Cloudflare account (skill `cloudflare-connection`). Then the address is permanent, sign-in
works, every element gets `<address>.<zone>`, and public pages stay up while the computer is off. With the own domain the start
no longer opens a temporary address.
