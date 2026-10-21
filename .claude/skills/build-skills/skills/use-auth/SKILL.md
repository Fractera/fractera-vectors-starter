---
name: use-auth
description: >
  Builder skill. How sign-in, roles and locks work in this Fractera element — who signs people in, which roles exist and how
  they inherit, how a branch, a page and a door are locked, the owner and temporary-address bypasses, guests, and how to add a
  role. Load it whenever a task mentions signing in, a login, a cabinet, «only for buyers», «admins only», a role, access, «who
  can see this», a guest, a private page or door, or the users table — and before you write any check of who the visitor is.
  The thing you cannot guess: this element never signs anyone in itself (the node's auth element does), the list of roles lives
  in one file, and on this computer you pass every lock — what you see is not what a visitor sees.
---

<!-- PROOF · PROVEN 2026-10-07: loaded twice; after the fix the door task planned the stranger check right · report: development-docs/proofs/2026-10-07-node-skills.md -->

# use-auth

> Informational, not binding: know a better way for the case in front of you — do it your way and say so. Not optional: no

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).
> own sign-in, no password, no role list outside `lib/roles.ts`.

## Who signs people in

The node's **auth element** — one per node. This element only redirects to it (`/login`, `/guest-in`) and reads the result:
`getSession()` (`lib/auth/get-session.ts`) on the server, `/api/me` in the browser. Never a login form, a password, a cookie
read by hand or a provider wired here.

## Roles — `lib/roles.ts`, the only list

- **Tiers** the gate enforces: `guest` → `user` → `architect` (the owner, passes everything).
- **Business roles**: `buyer`, `vip_user`, `subscriber_lite|standard|max` · `manager`, `senior_manager`, `support_manager`,
  `delivery_manager`, `content_editor`, `finance` · `admin`.
- **Inheritance** `ROLE_PARENTS`: `vip_user` → `buyer` → `user`, `subscriber_max` → `standard` → `lite` → `user`,
  `senior_manager` → `manager`. A cycle fails the build.

## Locks, from wide to narrow

| What | How |
|---|---|
| a branch | its `layout.tsx` — `AccessGate` with `PROTECTED_GROUP_ROLES.<branch>` (`account`, `staff`, `finance`, `admin`) |
| a page | a role folder `_pages/<role>/<page>/` and/or `meta.json` → `"roles"`; heirs of a role pass (skill `use-page-tree`) |
| a door | inside the handler: `requireRoles(req, roles)` or `getSession(req)`; the proxy covers only `/api/*`, a door in a branch guards itself |
| text | `{roles}` in a paragraph prints the page's lock list |

A refusal shows the access dialog with the roles needed and a way to sign in — never an error page.

🛑 **A page lock is signage, a door is the lock** (`components/auth/access-gate.client.tsx`). Pages are prerendered: their HTML,
with every text written into the page data, reaches anyone who asks for it — the dialog appears in the browser after loading.
So nothing private goes into page data; private data comes only through a door that checks the role itself.

## Bypasses — and why your check lies

- **Owner at this machine:** a request to `localhost`/`127.0.0.1` with no Cloudflare headers passes as the architect, a band
  warns about it (`lib/auth/owner-at-machine.ts`).
- **Temporary Cloudflare address**: the architect layer opens to anyone with the link — a conscious trade-off of the owner.
- So a lock is proven only as a stranger, and you can be one from this very computer: through the public address (own domain
  or subdomain) the request comes via Cloudflare and is not the owner. **A door:** `curl` it there without a session → expect
  401/403. **A page:** `curl` returns the same HTML to everyone (200) — that proves nothing; the dialog is seen only in a
  private browser window on the public address, so ask the person or say it is not checked. On the temporary address the
  architect layer is open — prove its locks on the own domain. A node with no public address cannot run a stranger check — say so.

## Guests

`/guest-in` gives a visitor a guest session without registration; the `guest` branch is theirs, and «Delete my account and
leave» (`/api/auth/guest-leave`) removes it.

## Adding a role

A line in `ALL_ROLES` (and its parent in `ROLE_PARENTS` if it inherits), the group it opens in `PROTECTED_GROUP_ROLES`, a role
folder for its pages; roles are given to people on the users table (`/admin/users`), which writes through the auth element. A
new role is the person's decision — ask first.
