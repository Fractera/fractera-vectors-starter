# widget-static-guest-account

The guest's own page (`/<lang>/guest`): «Go back» to the page the guest came from, and «Delete my account and leave».

- **Where it stands:** the last item of the sequence in `guest/_data/<lang>.json`; listed in `guest/_widgets/index.tsx`.
- **Words:** the field `account` of `guest/_data/<lang>.json` — no strings in code; a language without it shows English.
- **Doors:** `/api/me` (who is signed in), `/api/auth/guest-leave` (delete and leave). Both still at element level.
- **Files:** `index.tsx` — server part, reads the words; `actions.client.tsx` — the two buttons.
