import { AgentCard } from "@a2a-js/sdk"
import { DefaultRequestHandler, JsonRpcTransportHandler, ServerCallContext } from "@a2a-js/sdk/server"
import { cardJson } from "@/lib/a2a/card"
import { ElementExecutor } from "@/lib/a2a/executor"
import { ElementTaskStore } from "@/lib/a2a/sdk-store"
import { rpcError } from "@/lib/a2a/endpoint"

// THE ELEMENT'S A2A SERVER ON THE OFFICIAL SDK (step 418-1): `DefaultRequestHandler` (methods, task lifecycle, ids, errors) over
// the element's executor and task store, behind the SDK's JSON-RPC transport. The card is read per request — a passport edit
// (name, description) is visible without a rebuild. The route (`app/api/a2a/route.ts`) keeps the node's own gates in front:
// the node boundary, the node key, the protocol version and the conversation log.

const store = new ElementTaskStore()
const executor = new ElementExecutor()

export async function handleA2A(body: unknown, version: string): Promise<unknown> {
  const card = AgentCard.fromJSON(cardJson() ?? { name: "", description: "", version: "" })
  const transport = new JsonRpcTransportHandler(new DefaultRequestHandler(card, store, executor))
  const out = await transport.handle(body as Record<string, unknown>, new ServerCallContext({ requestedVersion: version }))
  // Streaming is not declared in the card (capabilities.streaming is absent): a stream answer is refused, not half-served.
  if (out && typeof (out as AsyncGenerator)[Symbol.asyncIterator] === "function") {
    void (out as AsyncGenerator).return?.(undefined)
    return rpcError((body as { id?: unknown })?.id, -32004, "Unsupported operation: streaming is not served by this element", "UNSUPPORTED_OPERATION")
  }
  return out
}
