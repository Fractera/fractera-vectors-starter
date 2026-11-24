import { dataUrl as nodeDataUrl, isRemoteData } from "@/lib/microservices/urls"
import { storeHeaders } from "./store-key.mjs"
// One place that answers "where is the data layer, and what proves me to it".
//
// The same code runs in two places and must not care which:
//   • On the server, next to the data service — the address is loopback and the
//     key is the node's DATA_SECRET for a native element preinstalled with the
//     node, or this element's own ELEMENT_KEY for one born on the node (node step
//     857: the installer withholds DATA_SECRET from it — store-key.mjs).
//   • On a developer's machine — the address and key come from the file the
//     admin panel generates (Env Variables → download), where they are called
//     REMOTE_DATA_URL and DATA_API_KEY.
//
// Both names are accepted so a project cloned from GitHub behaves exactly as it
// does in production. That is the whole point of the local-development loop:
// the repository carries code, the server keeps the data, and a laptop reads the
// server's data rather than an empty copy of its own.

export type DataService = { url: string; key: string; headers: Record<string, string> };

/** The headers that open the stores for this element — the node's key, else its own (`store-key.mjs`, node step 857). */
export { storeHeaders };

export function dataService(): DataService {
  const url = nodeDataUrl() ?? "";
  const headers: Record<string, string> = storeHeaders();
  const key = headers["X-Element-Key"] ?? headers["X-Data-Secret"] ?? "";
  return { url, key, headers };
}

/** True when this process can actually reach the data layer with credentials. */
export function dataServiceReady(): boolean {
  const { url, key } = dataService();
  return Boolean(url && key);
}

export async function dataFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { url, key, headers } = dataService();
  if (!key) {
    throw new Error(
      "No store key. On the server it is DATA_SECRET or ELEMENT_KEY, written by the node installer; on your machine, download .env.local from Admin → Env Variables.",
    );
  }
  return fetch(`${url}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

/** Read a JSON answer, turning a failure into a message that names the cause. */
export async function dataJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await dataFetch(path, init);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Data service ${res.status} on ${path}: ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Data service returned something that is not JSON on ${path}`);
  }
}
