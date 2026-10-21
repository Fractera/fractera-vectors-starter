---
name: github-repositories
description: >
  Builder skill. How every element of a Fractera node keeps itself on GitHub as its own repository — created by the person's button, named
  after the fork and the element's address, renamed together with the element, a common token or the element's own, importing
  another repository, and how the node is restored from them. Load it whenever the person asks where an element is stored, how
  to export an element as a separate service, «create a repository», «rename the element», «use another repository», «what
  token», «the red GitHub bar», or how to restore the node. Sending commits is skill `github-element`; selling an element is not
  this skill. The thing you cannot guess: repositories are created and renamed by the node with the person's token, one element
  at a time by a button — never by you and never automatically.
---

<!-- PROOF · NOT PROVEN yet: written, never checked by a live run (rules: development-docs/README.md, «Proof marks») -->

# github-repositories

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## One element — one repository

Each element (this one, the required ones — sign-in, data, settings, design — and every element the person made) is a whole
project of its own, and on GitHub it is a **private repository** named `<fork name>-<element address>`. That is how an element
leaves the node as a separate service: its repository can be cloned, run and developed on its own.

## How it appears

- Until the person gives a **GitHub token** every element lives only in its local git; a red bar over the core's pages says so.
- The token: «Build → GitHub» of the node (a classic token with `repo` and `workflow` — elements carry `.github/workflows`).
- The repository: **«Create and upload»** on the element's GitHub page (or in its row) — one element at a time, by the person's
  click; the whole local history goes up. Never created automatically (owner 2026-10-02: an element may still be named by its id).
- The element's **own token** on its GitHub page wins over the node's common one.

## When the name changes

Renaming the element (its address, «Settings» in the core) renames the repository the node created, together with the folder.
A repository the person brought themselves keeps its name.

## Another repository

«Replace the code» on the element's GitHub page brings another repository into this element (id, port, address and domain stay;
the old history is pushed to the element's repository first). A public repository without write rights comes in detached — then
«Create and upload» gives it the person's own private repository. Public is not free to use: the license decides.

## Restoring the node

The node pushes only one file to the person's fork — the snapshot `WEB4-ITEMS-REGISTRY/web4-items.node.json` (which elements,
which repositories). On a new computer cloning the fork brings every element back from its repository (skill `project-origin`).

## What you do

Point the person to the element's GitHub page; never create, rename or delete a repository yourself, never handle a token.
