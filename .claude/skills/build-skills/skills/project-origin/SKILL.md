---
name: project-origin
description: >
  Builder skill. How a Fractera project is born and stays updatable — only from the person's own fork of github.com/fractera/web4, cloned to
  their own computer; why any other copy is refused; how updates come («Sync fork» for the node, «Update» for an element); how
  a node is restored on a new computer. Load it whenever the person asks how to install, start, move or copy the project, «can I
  download it as a zip», «my friend gave me his copy», «how do I get updates», «I have a new computer», or sees
  ===ORIGIN_OUTDATED=== or «non-original Fractera project». The thing you cannot guess: the origin is checked by the node itself —
  a project that is not a direct fork of the original never installs, because only a fork keeps the road to updates open.
---

<!-- PROOF · PARTIAL 2026-10-07: loaded, answer right; the «Update» line changed after the run · report: development-docs/proofs/2026-10-07-node-skills.md -->

# project-origin

> Informational, not binding: know a better way for the case in front of you — do it your way and say so.

**Process: build** — this skill changes the element as a thing: code, commit, rebuild; confirm with the three lines of `.claude/modes/build.md` («Confirm the request first»).

## How a project is born

1. The person presses **«Fork»** on `github.com/fractera/web4` — their own fork, not someone else's, not a zip, not a clone of the
   original.
2. An AI agent on **their own computer** (never a cloud session — install refuses there with `===CLOUD_REFUSED===`) clones that
   fork, runs `npm install`, `npm run build`, `npm run serve:start`.
3. The first start installs the node's elements (sign-in, data, settings, design, the root site), starts the autostart and the
   watchdog, and puts the panel on a temporary Cloudflare address (skill `temporary-domain`).

`scripts/check-origin.mjs` (first step of the build and of the start) asks GitHub whether `origin` is a direct fork of
`fractera/web4`; anything else stops with «You are trying to install a non-original Fractera project».

## Why only a fork

A fork keeps the link to the original: Fractera's next release reaches the person by one button. A copy, a zip or a fork of a
fork loses that road for good, and the person would carry every fix by hand.

## How updates come

- **The node:** `===ORIGIN_OUTDATED===` is not an error — the fork is N changes behind; «Sync fork» on GitHub brings Fractera's
  changes into the person's fork. How the running node takes them from there — ask the person or the core's agent; do not guess.
- **An element:** «Update» in the GitHub section of the element's page in the node's core (not on github.com) merges Fractera's new tag; a conflict opens the element's terminal with the task. An
  element with the person's own commits is never reset to the tag — their work stays.

## Moving to a new computer

Clone **the person's own fork** (never a new fork): the node reads its snapshot `WEB4-ITEMS-REGISTRY/web4-items.node.json` and
clones every element from the person's repositories (skill `github-repositories`). Not restored yet: the own domain, the tunnel
and the data — say so.
