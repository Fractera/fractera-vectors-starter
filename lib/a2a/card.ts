import { readFileSync } from "node:fs"
import { join } from "node:path"
import { elementRoot } from "@/lib/page-tree"

// THE ELEMENT'S A2A CARD AS JSON (step 417/418): the body of the Google A2A card (OWN-SERVICE-PROPS/A2A-CARD.json) plus name,
// description and version from the passport — one truth, no second copy. Read on every call: an edit is visible without a rebuild.
// Two readers: the published card (`/.well-known/agent-card.json`) and the SDK request handler (`lib/a2a/sdk-server.ts`).

export type CardJson = Record<string, unknown> & { capabilities?: { extensions?: { uri?: string; params?: Record<string, unknown> }[] } }

export function cardJson(): CardJson | null {
  const root = elementRoot()
  try {
    const passport = JSON.parse(readFileSync(join(/*turbopackIgnore: true*/ root, "OWN-SERVICE-PROPS", "OWN-SERVICE-PROPS.json"), "utf8"))
    const body = JSON.parse(readFileSync(join(/*turbopackIgnore: true*/ root, "OWN-SERVICE-PROPS", "A2A-CARD.json"), "utf8"))
    const version = JSON.parse(readFileSync(join(/*turbopackIgnore: true*/ root, "package.json"), "utf8")).version ?? ""
    return { ...body, name: passport.name ?? "", description: passport.shortDescription ?? "", version: body.version ?? version }
  } catch {
    return null
  }
}
