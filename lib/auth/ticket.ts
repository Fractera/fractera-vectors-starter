import { authUrl as nodeAuthUrl } from "@/lib/microservices/urls"

// БИЛЕТ ЕДИНОГО ВХОДА (узел, шаг 328-3). Кука элемента на его собственном адресе; кто за ней — знает только центр входа
// узла, и спрашивается он по петле машины на каждый запрос (выход в центре гасит билет на всех доменах сразу).
export const TICKET_COOKIE = "fractera-ticket"

export type TicketWho = { userId: string; email: string | null; roles: string[] }

export function ticketFrom(cookieHeader: string): string | null {
  const m = cookieHeader.match(/(?:^|;\s*)fractera-ticket=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export async function whoByTicket(ticket: string): Promise<TicketWho | null> {
  const auth = nodeAuthUrl()
  if (!auth) return null
  try {
    const r = await fetch(`${auth}/api/auth/ticket?t=${encodeURIComponent(ticket)}`, { cache: "no-store", signal: AbortSignal.timeout(5000) })
    return r.ok ? ((await r.json()) as TicketWho) : null
  } catch {
    return null
  }
}
