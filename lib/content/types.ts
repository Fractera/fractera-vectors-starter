// Generic contract for any per-document, per-language content collection
// (news today; blog/documentation reuse it once they stop being EN-only).
// TBase = the base-language document (all translatable fields required).
// TOverride = a partial per-language override (same translatable fields, all optional),
// plus an optional `headings` map for swapping individual h2 text without
// replacing the whole `body` array.

import type { PageItem, FaqPair } from '@/lib/content/page-items'

export type LocalizedBody = {
  body: PageItem[]
  faq?: FaqPair[]
}

export type LocalizedBodyOverride = {
  headings?: Record<string, string>
  body?: PageItem[]
  faq?: FaqPair[]
}
