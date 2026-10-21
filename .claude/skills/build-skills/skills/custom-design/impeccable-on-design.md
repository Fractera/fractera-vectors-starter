# impeccable on the node's Design element — read before building any page with impeccable

The owner's decision (node step 333, 2026-09-28): a design skill is **married** to the node's Design element. The skill
chooses the world and the composition; **every colour, face and corner comes from the Design tokens**, so changing the
Design (its preset or its colours) restyles the page, light and dark included. No hex value, no font name, no pixel radius
in the page's code — only the tokens below and colours derived from them.

## The tokens the Design element gives every page

`--primary`, `--accent`, `--destructive`, `--muted` (each with `--…-foreground`, computed by lightness), `--background`,
`--foreground`, `--border`, `--muted-foreground`; faces `--font-heading`, `--font-body`, `--font-mono`; corners `--radius`.
They exist for the light theme and, under `.dark`, for the dark one.

## Roles are relations, not copies of tokens

Do not paint a role with a token that happens to be named alike: in a green preset `--primary` and `--accent` are both green,
and a world built on their contrast turns into one flat colour. Derive each role from **one anchor token by a fixed relation**
measured on the world's reference palette, with CSS relative colour:

```css
/* anchor: the preset's brand colour; H is its hue */
--role: oklch(from var(--primary) <L> <C> calc(h + <ΔH>));
```

The relation keeps the character (dark field + light complementary poster + bright signal) and gives every preset its own
colours automatically. Measure L, C and ΔH from the world's reference palette in OKLCH once, write them into the widget's CSS
as the only numbers, and say in the widget's README which reference they came from.

### Reference: the departure-board world (the home page), measured 2026-09-28

Reference palette (the look the owner approved): board `#1b2458`, flaps `#0c1230`, poster `#ffd400`, signal `#d40000`,
hall floor `#e6e7ea`. In OKLCH relative to the board's hue H:

| Role | L | C | hue | CSS |
|---|---|---|---|---|
| board (station sign, board, closing band) | 0.286 | 0.094 | H | `oklch(from var(--primary) 0.286 0.094 h)` |
| flaps (letter tiles) | 0.197 | 0.060 | H | `oklch(from var(--primary) 0.197 0.060 h)` |
| poster (timetable, ticker, departure time) | 0.881 | 0.181 | H + 182 | `oklch(from var(--primary) 0.881 0.181 calc(h + 182))` |
| signal (the one action) | 0.546 | 0.224 | H + 117.5 | `oklch(from var(--primary) 0.546 0.224 calc(h + 117.5))` |
| hall floor | 0.928 | 0.004 | H | `oklch(from var(--primary) 0.928 0.004 h)` |

Text on a role: light on board, flaps and signal (`--primary-foreground` is not reliable here because the board is darker
than the preset's primary — use `oklch(from var(--primary) 0.97 0.01 h)`), dark on poster and floor
(`oklch(from var(--primary) 0.20 0.03 h)`). Check contrast ≥ 4.5:1 for body text on each pair in the green, blue and default
presets before finishing. Faces: `--font-heading` for everything set on the board, `--font-body` for reading text. Corners:
`--radius` (tiles `calc(var(--radius) * 0.25)`).

Browser support: relative colour syntax works in current Chrome, Edge, Safari and Firefox; give each role a plain token
fallback first (`--board: var(--primary); --board: oklch(from …);`) so an old browser still shows a coherent page.

## The reference maquette comes first (owner, 2026-09-28)

The departure-board home page in its original colours — archived in git: template tag `v0.3.39`, folder
`components/landing-impeccable/` (`index.tsx`,
`impeccable.module.css`, `DIRECTION.md`) — is **the approved maquette**. Any page redrawn with impeccable for this element:

- **keeps its world and composition**: station sign → departure board (origin, three destinations with flip letters,
  platform squares, departure time) → yellow ticker with the «?» hint → the two actions → the timetable poster «What it can
  do» → the ticket «under the hood» → the closing band;
- **keeps its contrast**: a dark board, a light complementary poster, one bright signal, a pale floor. When colours come from
  the formula above, the relations are the ones measured on this maquette; with a primary of hue ≈ 272 the page must look
  like the maquette itself. Check contrast ≥ 4.5:1 for text on every pair;
- **aligns table-like rows on one grid**: when a section has a left column of titles and a right column of text (the
  timetable), the left column has ONE fixed width for all rows — the width of the longest title — so the right column starts
  at the same x in every row. A column sized per row makes the whole section «dance». Put the grid on the list (not on each
  row) or use `subgrid`, and let the title column be `max-content` of the widest title.

## Split-flap letters — animate the machine, not an effect (owner, 2026-09-28)

A departure board is a split-flap (Solari) display. Animate the real mechanism, never a generic «flip» or a fade:

- **One character cell = a drum of flaps** on an axle. Each flap carries the upper half of one character on its face and the
  lower half of the previous character on its back. You always see two halves: the upper half on the standing flap and the
  lower half on the flap that has already fallen. The thin line across the middle is the axle and the gap.
- **One step = the upper flap falls down** around the axle (`rotateX` 0 → −180°, perspective, `transform-origin` at the middle
  line): behind it the upper half of the NEXT character appears, and the fallen flap covers the lower half with the lower half
  of the next character. A step lasts about 60–80 ms; a real drum makes 10–20 steps a second.
- **The drum turns one way only.** The character set is a fixed ordered list, data, not code: blank first, then the letters in
  alphabet order (Cyrillic А–Я with Ё in its place, Latin A–Z), digits, a few signs. The number of steps from the current
  character to the target is `(index(target) − index(current) + length) mod length`: from «А» to «Б» is one step, from «Б» to
  «А» is the whole drum.
- **All cells start together and each stops on its own character**, so the word settles as a ripple: short trips land first,
  long ones keep rattling. Shorter words are padded with blanks to the board's width.
- **It starts when the board comes into view** (IntersectionObserver). Leaving the screen resets it; coming back starts the
  rattle again. Changing the destination (agent → application → automation) is the same rattle from the current letters to
  the new ones.
- **The board does not move.** No tilt, no parallax, no following the cursor: a station board is fixed to the wall.
- Build the cell from four layers — static upper half of the next character, static lower half of the current one, the
  falling flap (face = upper half of the current, back = lower half of the next, `backface-visibility: hidden`), the axle line —
  in a small `"use client"` island that advances steps with timers or `requestAnimationFrame`, no React state per frame if it
  can be avoided (CSS variables / class toggles). Under `prefers-reduced-motion` the letters stand on the target at once.

## How the agent works with this

1. The person asks for an own design → skill `custom-design` asks «taste or impeccable?» → load impeccable.
2. Build the page with impeccable fully (its world, its composition, its craft floor), then set every colour through the
   relations above (or measure a new reference palette for a new world the same way).
3. Write `designSkill` into the passport `OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json` and run `npm run describe:publish`.
