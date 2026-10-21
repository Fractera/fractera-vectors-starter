# `(protectedLayer)` — four protected branches

Not a route of its own: a route group. `layout.tsx` closes the whole layer to search engines. Inside — four branches, one
per category of roles (`lib/roles.ts` → `PROTECTED_GROUP_ROLES`): `account/`, `staff/`, `finance/`, `admin/`. Each
branch has its own lock (`<branch>/layout.tsx`); inside, a folder named after a role holds that role's pages and locks
them to the role and every role that inherits it (`lib/roles.ts` → `ROLE_PARENTS`, node step 402); `meta.roles` adds roles. The architect passes
every lock.

## The rule of the frame

This element is built on Next 16.2 and grows only inside its frame (`CLAUDE.md`, section «The frame»). A branch has
code only at its root: `layout.tsx` + `page.tsx`, and one `[...slug]/page.tsx` that draws every child. **A new page is a
folder of data in `_pages/`, never a new `page.tsx`** — the build grows with the number of route files, not pages
(measured: 300 page files 1252 s, the same pages through one template 98 s). `scripts/check-routes.mjs` fails the build
on any route file outside its closed list. Skill: `.claude/skills/build-skills/skills/use-page-tree`.

Pages are static: the build draws only the roots; a child is drawn on its first visit and refreshed every five minutes
(`revalidate = 300`). Texts are JSON read at run time (`lib/page-tree.ts`, `ELEMENT_DIR`): a corrected paragraph shows
up within five minutes without a rebuild — or at once after `npm run pages:refresh`, which the agent runs after every
text change before telling the person the change is live. Every page has `en.json` (required) and `ru.json`; no visible string in code.
