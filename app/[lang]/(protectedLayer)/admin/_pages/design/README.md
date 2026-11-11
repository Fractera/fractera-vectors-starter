# `admin/_pages/design` — this element's own design workshop (node step 579-1)

`/<lang>/admin/design` (fonts) and its sections `colors`, `type`, `shape` — one page per section, each a route. The editors read and write this element's `DESIGN-CONFIG` through
`/<lang>/admin/api/settings/design`, and the pages redraw at once, with no build.
In the core this workshop opens from «Build → Design» of the element, in a new tab. Skill `use-design`.
