# Glossary

One place where a word means one thing, so `CLAUDE.md`, a skill and a development document cannot define it differently.
The person speaks by voice and in their own language: their word goes in the second column, verbatim in quotes.

- A word of the person, or a term of `CLAUDE.md` or a skill, that can be read two ways — open this file before acting on it.
- A term used by two or more places (two skills, a skill and `CLAUDE.md`) — it belongs here, added in the same commit that
  starts using it. A term used in one place is explained there.
- A term changes meaning — rewrite its row; the old meaning goes to `cancelled.md` with the date and why.

## The element and where it lives

| Term | The person may say | What it means |
|---|---|---|
| **element** | «элемент», «AGI ITEM», «айтем», «микросервис» | One self-contained thing in the node with its own folder, port, address, repository and agent. To the node it is a microservice that answers its neighbours and asks them for help; to a person it is a whole project — a site, an app, an agent or a service — that can be opened, developed, shared and sold. This element is one. |
| **node** | «узел», «нода» | Every element on one person's computer together with the core. It belongs to the person and works without Fractera. |
| **core** | «ядро» | The node's centre: the registry of elements, discovery, install, the architect's pages (the element's menu is drawn by the core). It is not an element and is not replaced. |
| **neighbour** | «сосед» | Another element of the same node. |
| **live site** | «живой сайт», «Preview» | The element's running build as a visitor sees it, shown on the core's page of the element. |
| **Preview & Deploy** | «предпросмотр», «развёртывание», «Принять» | A new version built next to the running one; «Accept» switches to it, «Reject» drops it. Skill `deploy-element`. |

## Two processes — name which one before any task

| Term | The person may say | What it means |
|---|---|---|
| **build process** | «строительный процесс», «строительство» | Everything that changes the element as a thing: code, design, texts, deploy, a new ability. Your **Builder** nature (`CLAUDE.md`, «4. Process»). **What follows:** git changes — a commit, a push to GitHub, a rebuild («Preview & Deploy»); the answer is the full form — the three confirming lines, the plan, the person's «yes» (`.claude/modes/build.md`, «Confirm the request first»). In the core's menu: «Build» (with «Inside the node (i2i)») and «Product design». |
| **working process** | «рабочий процесс», «работа элемента» | What the running element does: its work skills, reminders and schedules, calls from the elements of this node, to whom it gives them, at what price and limit. Your **Worker** nature. **What follows:** only data changes (`data/`, outside git) — no code, no commit, no push, no rebuild; the answer is one or two lines, like any Claude Code agent, no restatement and no «yes?». The test: **will git change after this?** Yes — it is the build process. Owner of the node, 2026-10-12: «автоматизация рабочего процесса не должна приводить к сборке проекта». In the core's menu: «A2A» and «Process». |

## Talking to others

| Term | The person may say | What it means |
|---|---|---|
| **H2A** | «эйч-ту-эй», «человек и агент» | A person and their own agent: Telegram, the core's native chat, the terminal. A file they send is saved and passed on as a link. |
| **i2i** | «ай-ту-ай», «элемент-элемент» | Elements of ONE node and the core: their agents meet over the A2A wire only to agree an API; then the work runs over that API with no model. Build process; tabs in the core's «Build → Inside the node (i2i)». |
| **passport** | «паспорт», «описание о себе» | `OWN-SERVICE-PROPS/` — what the element tells the outside about itself; its main door. Skill `describe-element`. |
| **A2A card** | «визитка» | The standard card served at `/.well-known/agent-card.json`, built from `OWN-SERVICE-PROPS/A2A-CARD.json` plus the passport. |
| **skill (of the card)** | «навык», «способность» | One thing the element can do for others, a row of the card's `skills`. Not the same as an agent skill in `.claude/skills/`. |
| **HTTP door** | «дверь», «http-door» | A route other elements call over plain HTTP, not over A2A; in the card such a skill carries the tag `http-door`. |
| **catalog** | «каталог» | What an element can give away — blocks, sections — through find · get · contribute. On the core's page «Catalog» also lists the node's elements. |
| **node key** | «ключ узла» | The key elements of one node use to call each other; an outside agent does not have it. |

## Building records

| Term | The person may say | What it means |
|---|---|---|
| **step · substep** | «шаг», «подшаг» | A unit of building with its own number (this element's own, from 1); a substep is one observable result with its checks. Skill `use-development-docs`. |
| **intake** | «приёмная», «заявка» | `pre-steps/` — building requests not started at once, recorded verbatim. |
| **proof mark** | «метка доказательства», «PROVEN» | A note in `CLAUDE.md` or a skill that a part was proven live, with the report in `proofs/`. |
| **backlog** | «бэклог», «долг» | `backlog.md` — built but not explained, built halfway, or promised. |
| **cancelled** | «отменённое», «откати» | `cancelled.md` — what was dropped or rolled back, by whose word and what replaced it. |
| **report** | «отчёт», «разбор» | `reports/` — `errors-…` explains one failure, `feature-…` describes a finished capability. |

## Web2, Web3, Web4, Lagrix and the node's modes (owner of the node, 2026-10-22)

| Term | How it may sound | What it means here |
|---|---|---|
| **Web2** | «веб два», «обычный сайт» | The element as an ordinary site and service: pages, sign-in, its own data, card payments (Stripe, Lava.top). No network of agents. An element used only in Web2 does not need A2A or reviews. |
| **Web3** | «веб три», «кошелёк», «блокчейн» | Money on a blockchain: the node's wallet (or, on an app factory, the element's own), USDC; Lagrix deals settle through its contracts on an L2. In the core: «Settings → Payments → Web3». |
| **Web4** | «веб четыре», «сеть агентов» | Our word for the network of agents: an element «in the Web4 network» can be found by agents of other nodes and receive their orders through Lagrix (a2a), and earns reputation from paid deals. The flag is the passport's `visibility`: `network` — in the Web4 network, `node` — only inside this node. A **WEB4 ITEM** is an element of this architecture. |
| **Lagrix** | «лагрикс» | An open protocol and network of agents (lagrix.dev, repository `lagrix-dev/lagrix`, MIT), not part of Fractera and not run by it: discovery of agents, escrow deals in USDC, reputation only from paid deals; it has no coin of its own. Fractera meets Lagrix exactly like any other framework (a2a) and exchanges whole elements with other Fractera projects through it (f2f). The network is not live yet: the search is simulated and finds nothing — say so, never pretend. |
| **single project** | «единый проект», «один хозяин» | The node's mode for one owner: every element lives under the core's CONFIG (one header, footer, languages), one wallet — the node's, no Messenger section in the elements. The default. |
| **app factory = integrator mode** | «завод приложений», «режим интегратора» | The node's mode for an integrator: one owner of the core (the node) gives many users ready elements that work as their own agents inside each user's own application. Each application has its own people (own accounts), its own settings; the user can add their own wallet and follow their own statistics. Lagrix calls this mode the **integrator mode**. |
| **integrator** | «интегратор» | The owner of a node in the app factory mode. The reputation the applications earn in Lagrix belongs to the integrator for good: a user can never take it away. A user will be able to move their solution to their own server — planned, not built yet. |
