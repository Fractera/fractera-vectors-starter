# A2A on this node — reference only

You do not build these by hand: `npm run a2a` (the official SDK client) does. This page is for reading a raw answer.

- Standard: Google A2A v1.0.0 (`github.com/a2aproject/A2A`, `spec/a2a.proto`); JSON is camelCase. The node's notes:
  `lib/a2a/STANDARD.md` in the core.
- This element serves it through the official SDK `@a2a-js/sdk` (`lib/a2a/sdk-server.ts`), JSON-RPC binding at the card's
  `supportedInterfaces`; methods `SendMessage`, `GetTask`, `ListTasks`, `CancelTask`; streaming is not served.
- Task ids are UUIDs given by the SDK; who sent the task and when is in `metadata.from` / `metadata.createdAt`.
- Task states: `TASK_STATE_SUBMITTED`, `WORKING`, `INPUT_REQUIRED`, `AUTH_REQUIRED`, `COMPLETED`, `FAILED`, `CANCELED`, `REJECTED`.
- Answer: `result.task.status` (state, a message in words), `result.task.artifacts[].parts` — `text` for the person, `data` for code.
- Error: `error.code`, `error.message`, reason in `error.data[0].reason` (`TASK_NOT_FOUND` -32001, `TASK_NOT_CANCELABLE` -32002,
  `UNSUPPORTED_OPERATION` -32004, `VERSION_NOT_SUPPORTED` -32009). A refused skill here is a `FAILED` task with
  `status.message.metadata.reason`.
- The node's gates before the SDK: the node key (`X-Node-Key`, else -32000 Unauthenticated) and the node boundary (an element
  with visibility `node` answers through the tunnel as absent).
