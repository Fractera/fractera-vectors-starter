# widget-dynamic-design-brief

The design brief of this element (step 706-4): who the site is for, its character in up to five words, references (a link and/or an
uploaded screenshot in the element's own store), what to avoid, the design skill. Saved into the passport's `design` part through
`/<lang>/admin/api/settings/brief`; `designSkill` follows `design.skill`. The element's design pass reads it first; the core takes it with
the description, so a sibling can be born «like this element» (`create --look-like`).

Build cost: one client island on the admin page, no build to change the brief. Caching: none — the admin layer.
