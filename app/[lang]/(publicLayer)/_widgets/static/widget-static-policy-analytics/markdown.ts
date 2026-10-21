import { getAppConfig } from "@/config/app-config"
import { policyTools } from "@/lib/policy-tools"
import { policyAnalyticsWords } from "./words"

// The same section for machines (the page's Markdown copy and llms-full.txt): empty while Google Analytics is off.
export function markdown(lang: string): string {
  const cfg = getAppConfig()
  if (!policyTools(cfg).googleAnalytics) return ""
  const w = policyAnalyticsWords(lang, cfg.analytics.googleAnalyticsId ?? "")
  return [`## ${w.title}`, "", ...w.paragraphs.flatMap((p) => [p, ""]), ...w.cookies.map((c) => `- \`${c.name}\` — ${c.purpose}, ${c.life}`), "", w.withdraw, ""].join("\n")
}
