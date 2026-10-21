import { getAppConfig } from "@/config/app-config"
import { H2, P } from "@/components/ui/typography"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { policyTools } from "@/lib/policy-tools"
import { policyAnalyticsWords } from "./words"

// The Google Analytics section of the policy pages (node step 449-2): drawn only while Google Analytics is on in the site
// settings, and gone the moment it is switched off — the page itself stays static and changes on the settings' redraw.
export function PolicyAnalytics({ lang }: { lang: string }) {
  const cfg = getAppConfig()
  if (!policyTools(cfg).googleAnalytics) return null
  const w = policyAnalyticsWords(lang, cfg.analytics.googleAnalyticsId ?? "")
  return (
    <section data-block="pa0s1" className="mx-auto w-full max-w-3xl px-4 py-6">
      <H2 data-block="pa0h2">{w.title}</H2>
      {w.paragraphs.map((p, i) => (
        <P key={i} data-block={`pa0p${i}`}>{p}</P>
      ))}
      <div data-block="pa0tb" className="my-4">
        <Table data-block="wj6jk">
          <TableHeader>
            <TableRow>
              {w.head.map((h) => <TableHead key={h}>{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {w.cookies.map((c) => (
              <TableRow key={c.name}>
                <TableCell className="font-mono">{c.name}</TableCell>
                <TableCell>{c.purpose}</TableCell>
                <TableCell>{c.life}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <P data-block="pa0wd">{w.withdraw}</P>
    </section>
  )
}
