# `_tools/` — the element's tools

A tool is a ready capability that knows no page: voice input, image crop, video trim, code view, a translations dialog,
socials by AI, a chat, a draft from free words. **Look here before building anything similar** — the list is
`_tools/TOOLS.json`, and `npm run passport -- me` shows the names (`tools`).

## Naming

Every tool folder is `tool-<name>` (owner 2026-10-07): `tool-voice-input`, `tool-image-crop`. The name tells what the thing is
in any search or import without opening it. The same family across the element: widgets `widget-static-<name>` /
`widget-dynamic-<name>`, blocks `block-<name>`. `check:tools-map` refuses a folder with another name.

## Tool or widget — decide before the first line

One question: **will a second caller want exactly this thing?**

| | Tool | Widget |
|---|---|---|
| knows | no domain, no page | the look and logic of one page |
| home | `_tools/tool-<name>/` — element level | `<branch>/_widgets/static|dynamic/widget-…/` — inside its route |
| fate | lives while at least one caller needs it | dies with its route |

A piece that started in one page and is now wanted by a second one moves here — never stays at its first caller.

## A tool folder

```
_tools/tool-<name>/
├── tool.json        ← the card: id, entry, needs, npmDeps, usedBy, en/ru title · what · how · value
├── client/          ← browser half (entry file named in the card)
├── server/          ← server half, when the tool calls a model or a service
└── types/           ← its types and its own words (*.i18n.ts)
```

- **The description lives next to the tool**, in `tool.json` — not in a page's dictionary: text torn from its code goes stale
  silently on the day the tool is edited.
- **A tool does not know where its result goes**: the caller passes the door and receives the result (`onSend`, props).
- **Its server door** is a thin wrapper at element level: `app/api/tools/tool-<name>/route.ts` — checks the caller's role,
  puts the key in, calls `server/`. Tools are shared by every route, so their doors are not inside a branch. A door whose
  schema belongs to one page (`tool-fact-draft`'s field list) is that page's door, inside its branch.
- **Everything it imports outside its folder** is a shared piece of the element (`components/ui`, `components/dialog`,
  `components/form`, `lib/`) — never a branch's own file.

## The list is generated — a second list is forbidden

`npm run build:tools-map` renders `_tools/TOOLS.json` from the cards. `npm run check:tools-map` (part of `prebuild`) fails when
a folder has no card, a card names a file that is not on disk, the folder is not `tool-<name>`, or the map is stale. A number
or a list of tools written by hand anywhere else goes wrong silently — the passport's `tools` reads this map.

## Adding a tool

Skill `use-tools`: the folder, the card, the door, the generated map.

## Where these came from

The first eight were taken from `fractera-next-starter/_tools/` on 2026-10-07 (node step 421) and renamed `tool-<name>`.
