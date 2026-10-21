// Types for lib/a2a/guard.mjs (step 419-1) — the TypeScript side (reply door, executor) imports the same functions as the CLI.
export type Action = "deny" | "mask" | "off"
export type RuleName = "card" | "cvv" | "secret" | "phone" | "email" | "owner-words"
export type Policy = { rules: Record<RuleName, Action>; ownerWords: string[] }
export const DEFAULT_POLICY: Readonly<Policy>
export function loadPolicy(root?: string): Policy
export function checkOutbound(input: unknown, policy?: Policy): { verdict: "allow" | "mask" | "deny"; rules: RuleName[]; text: string }
export function checkOutboundData(value: unknown, policy?: Policy): { verdict: "allow" | "mask" | "deny"; rules: RuleName[]; data: unknown }
export function blockedReason(rules: string[]): string
export function logGuard(dataDir: string | undefined, rec: { channel: "reply" | "skill" | "send"; verdict: string; rules: string[]; taskId?: string; to?: string }): void
