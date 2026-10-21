# widget-dynamic-users-table

The table of accounts on `/<lang>/admin/users`: search on top, pages below, last seen, a role per row.

- **Where it stands:** the last item of the sequence in `admin/_pages/users/<lang>.json`; listed in `admin/_widgets/index.tsx`.
- **Words:** `ui.i18n.ts`, chosen by the server (`usersTableUi(lang)`) and passed as a prop.
- **Doors:** `/api/users`, `/api/users/<id>` — still at element level.
- **While loading or without the server:** `skeleton.tsx` — the table's own shape.
- **Files:** `index.client.tsx` (the island) · `use-list.ts` (fetching) · `toolbar`, `row`, `pager` · `last-seen.ts`.
