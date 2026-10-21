# Settings listener — a CONFIG change reaches this site without a restart

Step 306 of the node (owner, 2026-09-26: «строим уведомление от CONFIG»). Portable: any service of the node that lives by
the project settings takes the same three pieces.

## What it gives

The architect saves a setting in CONFIG → CONFIG sends every subscribed service the signal «the version changed» →
the service fetches the settings itself over MCP and refreshes its prerendered pages. Pages stay static: the server
re-renders them once and serves ready HTML again. The visitor sees the change after reloading the page.

## Where it lives

| Piece | File |
|---|---|
| subscribe at start, key check, signal handler | `lib/settings-listener.ts` |
| the door the signal arrives at | `app/api/settings/changed/route.ts` (`POST`, key in `X-Settings-Key`) |
| the call at start | `instrumentation.ts` (after the first `pullProjectSettings`) |
| fetching and the local copy | `lib/project-settings.ts` (`pullProjectSettings`, `callTool`) |
| the other side | CONFIG: MCP tool `subscribe`, `subscribers.js`, notification after `PATCH /api/settings/<kind>` |

## Environment

`CONFIG_SERVICE_URL` (the CONFIG element), `SETTINGS_SECRET` (the node key — the same for reading and for the signal),
`PORT` (the door address is `http://127.0.0.1:<PORT>/api/settings/changed`). `proxy.ts` must let `/api/settings`
through without a session (`PUBLIC_API_PREFIXES`) — the key guards the door.

## Connect it to another service

1. Copy `lib/settings-listener.ts` and the route; point the imports at your own `pullProjectSettings`/`callTool`.
2. In `instrumentation.ts`, after your start-up pull: `await subscribeToConfig("<your id>")`.
3. In the route, `revalidatePath` exactly the layouts and routes that read the settings.

```ts
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const { pullProjectSettings } = await import("./lib/project-settings")
  await pullProjectSettings()
  const { subscribeToConfig } = await import("./lib/settings-listener")
  await subscribeToConfig("blocks")
}
```

## Rules

- The signal carries no settings, only the version: there is one reading path, and a forged signal changes nothing beyond
  what CONFIG already holds.
- Only in answer to a human save: no timers, no polling, no retries. A missed signal is caught up at the next start.
- Not applied on the fly: the language set (`generateStaticParams`) and `NEXT_PUBLIC_*` — they are baked by the build.
- An open browser tab does not change by itself — only after a reload.

## Remove it

Delete the call in `instrumentation.ts`, the route and `lib/settings-listener.ts`. CONFIG keeps the address in its
`subscribers.json`; a signal to a missing door fails quietly and does not stop saving.

## Proven by

The isolated pair CONFIG `:3998` + built root `:3999`: a save in CONFIG changes the page with the same root process; a
signal without the key → 401 and the page stays (306-2).
