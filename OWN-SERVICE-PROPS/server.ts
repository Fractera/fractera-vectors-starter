import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import { timingSafeEqual } from "node:crypto"
import { join } from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { elementRoot } from "@/lib/page-tree"
import { hiddenFrom } from "@/lib/a2a/boundary"
import { coreUrl } from "@/lib/a2a/log"
import { getAppConfig } from "@/config/app-config"

// THE ELEMENT'S MAIN DOOR (README.md here). The answer = OWN-SERVICE-PROPS.json (what only the agent or the person knows)
// + fields computed at the moment of the request from the files the node already keeps (address, version, dates, skills,
// GitHub) — written into the file they would be copies that drift. Read on every request: an edit is visible without a rebuild.
// 🔒 Open, no key. Private fields (the author's e-mail, the server IP, which elements of the node it is tied to) are added only
// for the node itself — a request with the node key (X-Node-Key). A node-only element answers as absent through the tunnel.

const readJson = <T,>(p: string): T | null => {
  try {
    return JSON.parse(readFileSync(p, "utf8")) as T
  } catch {
    return null
  }
}

function nodeKeyOk(given: string | null): boolean {
  const expected = process.env.SETTINGS_SECRET ?? ""
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** One git date of the element's own history: the first commit (born) or the last one (updated); "" when unknown. */
function gitDate(root: string, first: boolean): string {
  try {
    const out = execFileSync("git", ["-C", root, "log", "--format=%cI", ...(first ? ["--reverse"] : ["-1"])], {
      encoding: "utf8",
      windowsHide: true,
      timeout: 5000,
    })
    return out.split("\n")[0]?.trim() ?? ""
  } catch {
    return ""
  }
}

/** Where the element answers: its own domain if one is attached, else `<address>.<zone>`; the project = the node's zone. */
function addresses(id: string) {
  const data = process.env.SERVICE_DATA_DIR?.trim() ?? ""
  const zone = readJson<{ zone?: string }>(process.env.NODE_DOMAIN_FILE?.trim() ?? "")?.zone ?? ""
  const address = readJson<{ address?: string }>(join(data, "address.json"))?.address ?? id
  const own = readJson<{ domain?: string }>(join(data, "domain.json"))?.domain ?? ""
  return {
    project: zone ? `https://${zone}` : "",
    url: own ? `https://${own}` : zone ? `https://${address}.${zone}` : "",
    ownDomain: own,
  }
}

/**
 * Only this element's own WORK skills — the job it was made for (owner 2026-10-06). Builder skills and every-element skills are
 * innate to every element born from the starter: they tell a stranger nothing. A skill counts when its description starts with
 * «Work skill».
 */
function skills(root: string): string[] {
  const dir = join(root, ".claude", "skills")
  try {
    return readdirSync(dir)
      .filter((n) => {
        try {
          const text = readFileSync(join(dir, n, "SKILL.md"), "utf8")
          return /^description:\s*(>\s*\n\s*)?"?Work skill/m.test(text)
        } catch {
          return false
        }
      })
      .sort()
  } catch {
    return []
  }
}

/**
 * The element's tools — names only (owner 2026-10-07: an agent choosing which of several elements to connect can prefer the one
 * with the richer set of tools). Read from the generated map `_tools/TOOLS.json`, the one list of the folder — never a second copy.
 */
function tools(root: string): string[] {
  const map = readJson<{ tools?: { id?: string }[] }>(join(root, "_tools", "TOOLS.json"))
  return (map?.tools ?? []).map((t) => t.id ?? "").filter(Boolean).sort()
}

function github(): string {
  const repo = readJson<{ repo?: string }>(join(process.env.SERVICE_DATA_DIR?.trim() ?? "", "github", "state.json"))?.repo
  return repo ? `https://github.com/${repo}` : ""
}

/** Who has called this element over A2A — names of elements only, from the core's conversation log. */
async function calledBy(id: string): Promise<string[]> {
  const core = coreUrl()
  const key = process.env.SETTINGS_SECRET ?? ""
  if (!core || !key) return []
  try {
    const r = await fetch(`${core}/api/node/a2a-log?element=${encodeURIComponent(id)}&limit=500`, {
      headers: { "X-Node-Key": key },
      signal: AbortSignal.timeout(4000),
    })
    const b = (await r.json()) as { rows?: { from_element?: string; to_element?: string }[]; agents?: { key: string; name: string }[] }
    const name = (k: string) => b.agents?.find((a) => a.key === k)?.name ?? k
    const from = (b.rows ?? []).filter((x) => x.to_element === id && x.from_element).map((x) => name(x.from_element!))
    return [...new Set(from)].sort()
  } catch {
    return []
  }
}

type Row = { id: string; custom: boolean; service: string; title: string | null; description: string | null; link: string | null; status: string; role?: string | null }

/** The node's composition as the core sees it (Dashboard → Projects), for this element's own agent. */
async function project(core: string | null, zone: string): Promise<Record<string, unknown>> {
  const key = process.env.SETTINGS_SECRET ?? ""
  let elements: unknown[] = []
  // 553: the node type — project (one owner, every element under the core's CONFIG) or factory (hosting of projects of
  // different owners). Unknown or no answer — project, the default.
  let nodeType = "project"
  if (core && key) {
    try {
      const r = await fetch(`${core}/api/node/projects`, { headers: { "X-Node-Key": key }, signal: AbortSignal.timeout(8000) })
      const b = (await r.json()) as { rows?: Row[]; nodeType?: unknown }
      if (b.nodeType === "factory") nodeType = "factory"
      elements = (b.rows ?? []).map((x) => ({
        id: x.id,
        name: x.service,
        kind: x.custom ? "custom" : "native",
        description: x.description ?? x.title ?? "",
        // 548-10: the role the node gives this element in one sentence (the core's roles) — what it does for the others.
        role: x.role ?? null,
        url: x.link ?? "",
        status: x.status,
      }))
    } catch { /* ядро не ответило — состава нет, а не «пусто» */ }
  }
  return {
    domain: zone,
    core: core ?? "",
    nodeType,
    elements,
    // Владелец 2026-10-06: как работать с соседом, паспорт не объясняет — сосед находится в реестре ядра, а об API договариваются по i2i.
    cooperation: "i2i: the connectors with the core, auth, data, config and design are built — use them in code; for a new need find the element in the core's registry, agree an API with its agent (npm run a2a), then call that API with no model.",
    a2aRegistry: core ? `${core}/api/node/a2a` : "",
  }
}

/** Last commit of the element and how many there are — as the core's summary shows it. */
function commit(root: string): { hash: string; subject: string; count: number | null } {
  const run = (args: string[]) => {
    try {
      return execFileSync("git", ["-C", root, ...args], { encoding: "utf8", windowsHide: true, timeout: 5000 }).trim()
    } catch {
      return ""
    }
  }
  const [hash = "", subject = ""] = run(["log", "-1", "--format=%h%x09%s"]).split("	")
  const count = Number(run(["rev-list", "--count", "HEAD"]))
  return { hash, subject, count: Number.isInteger(count) && count > 0 ? count : null }
}

/** Public pages of the element, from its own sitemap (paths only) — what a visitor can open. */
async function routes(port: string | undefined): Promise<string[]> {
  if (!port) return []
  try {
    const r = await fetch(`http://localhost:${port}/sitemap.xml`, { signal: AbortSignal.timeout(4000) })
    const xml = await r.text()
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
      try {
        return new URL(m[1]).pathname
      } catch {
        return ""
      }
    })
    return [...new Set(paths.filter(Boolean))].sort()
  } catch {
    return []
  }
}

type NodeState = {
  place?: { kind?: string; source?: string }
  isolation?: { kind?: string; source?: string }
  reach?: { kind?: string; host?: string; source?: string }
}

/** Where the node runs, its isolation and how it is reached — the core's node-state indicator, with each value's source. */
async function nodeState(core: string | null): Promise<NodeState | null> {
  if (!core) return null
  try {
    const r = await fetch(`${core}/api/node/state`, {
      headers: { "X-Node-Key": process.env.SETTINGS_SECRET ?? "" },
      signal: AbortSignal.timeout(6000),
    })
    return r.ok ? ((await r.json()) as NodeState) : null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  if (hiddenFrom(req.headers)) return NextResponse.json({ error: "not-found" }, { status: 404 })
  const root = elementRoot()
  const own = readJson<Record<string, unknown> & { id?: string }>(
    join(/*turbopackIgnore: true*/ root, "OWN-SERVICE-PROPS", "OWN-SERVICE-PROPS.json"),
  )
  if (!own?.id) return NextResponse.json({ error: "unreadable" }, { status: 500 })
  const node = nodeKeyOk(req.headers.get("x-node-key"))
  const author = getAppConfig().author ?? {}
  const domainFile = readJson<{ zone?: string; tunnelId?: string }>(process.env.NODE_DOMAIN_FILE?.trim() ?? "")
  const zone = domainFile?.zone ?? ""
  const ip = process.env.SERVER_IP?.trim() ?? ""
  const port = process.env.PORT?.trim()
  const where = addresses(own.id)
  const { calls, id, name, shortDescription, longDescription, accepts, returns, designSkill, isFracteraArchitecture, framework, elementType, visibility } = own
  const proj = node ? await project(coreUrl(), zone) : null
  const state = await nodeState(coreUrl())
  // calledBy — only real elements of the node: test probes and unknown callers of the log are not ties.
  const known = new Set(
    ((proj?.elements as { id: string; name: string }[] | undefined) ?? []).flatMap((e) => [e.id, e.name.split(".")[0]]),
  )
  const body = {
    // Written in the file — who I am and my job (only the working nature).
    id,
    name,
    shortDescription,
    longDescription,
    accepts,
    returns,
    // The design skill this element is built with (custom-design): its name, or "" when none.
    designSkill: typeof designSkill === "string" ? designSkill : "",
    // Built on the Fractera architecture (a Fractera starter) or not (a custom template, plain React …) — owner 2026-10-07.
    isFracteraArchitecture: isFracteraArchitecture === true,
    // The framework inside (`next`, `react`, `express` …): an agent decides whether this element fits its project.
    framework: typeof framework === "string" ? framework : "",
    // 544 (owner 2026-10-19): native — a root element of every node, only from the Fractera repository; custom — born by «Create WEB4 ITEM».
    elementType: elementType === "native" ? "native" : "custom",
    skills: skills(root),
    tools: tools(root),
    visibility,
    addresses: { internet: where.url, ownDomain: where.ownDomain, project: where.project, routes: await routes(port) },
    // Where it runs — the core's node-state indicator, each value with its source (declared by the person / measured):
    // home or server, how the node is reached, whether it goes out through a tunnel; isolation and IP only to the node.
    host: {
      place: state?.place?.kind ?? "unknown",
      placeSource: state?.place?.source ?? "unknown",
      reach: state?.reach?.kind ?? "unknown",
      tunnel: Boolean(domainFile?.tunnelId),
      ...(node
        ? { isolation: state?.isolation?.kind ?? "unknown", isolationSource: state?.isolation?.source ?? "unknown", publicIp: ip }
        : {}),
    },
    version: readJson<{ version?: string }>(join(root, "package.json"))?.version ?? "",
    commit: commit(root),
    created: gitDate(root, true),
    updated: gitDate(root, false),
    github: github(),
    author: { name: author.name ?? "", ...(node ? { email: author.email ?? "" } : {}) },
    ...(node
      ? {
          // 417: on this machine (as the element's indicator) and the project around — node-only: machine facts.
          machine: { port: Number(port) || null, localUrl: port ? `http://localhost:${port}` : "", folder: root, status: "running" },
          calls: calls ?? [],
          calledBy: known.size ? (await calledBy(own.id)).filter((n) => known.has(n)) : await calledBy(own.id),
          project: proj,
        }
      : {}),
  }
  return NextResponse.json(body, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } })
}
