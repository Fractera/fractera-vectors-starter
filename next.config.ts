import path from "node:path"
import type { NextConfig } from "next"

// The node starts this site with the standalone server: it reads PORT and HOSTNAME
// from the environment, which is exactly how the node assigns a port. `next start`
// refuses to run with `output: standalone`, so the passport names the server file.
//
// The ROOT IS THIS FOLDER, named explicitly. Inside a node the site lives in
// WEB4-ITEMS/core/root, and Next, seeing the node's lockfile above, took the node for
// the project root and tried to compile the node's own proxy.ts.
const root = path.resolve(__dirname)

const nextConfig: NextConfig = {
  output: "standalone",
  // 280-9: the node builds this site into a NEIGHBOUR folder (.next-a / .next-b) while the running
  // build keeps serving — no downtime. Unset, it is the usual .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: root,
  // 314-2: данные страниц (JSON дерева) едут в standalone-сборку — запасной источник, когда `ELEMENT_DIR` не задан.
  outputFileTracingIncludes: {
    '/**': ['./app/**/_data/*.json', './app/**/_pages/**/*.json', './node_modules/sqlite-vec/**', './node_modules/sqlite-vec-*/**'],
    // 458-3: шрифт сниппетов читается с диска (lib/snippet/render.mjs), сборщик сам его не находит.
    '/[lang]/**': ['./node_modules/@fontsource/inter/files/inter-*-normal.woff'],
  },
  turbopack: { root },
  // 550: родные модули элемента хранения не собираются в пакет, а грузятся из node_modules.
  serverExternalPackages: ["better-sqlite3", "sqlite-vec"],

  // Old addresses live in other people's bookmarks: they answer with a permanent
  // redirect, not a 404.
  async redirects() {
    return [
      { source: "/:lang/architecture", destination: "/:lang/m2m", permanent: true },
      { source: "/:lang/architecture/index.md", destination: "/:lang/m2m/index.md", permanent: true },
      // The architect pages live in the node's core (280), on its own address. The installer
      // writes that address into ARCHITECT_URL; without it the link has nowhere to go and
      // no rule is made, so the page answers 404 instead of pointing at a wrong host.
      ...(process.env.ARCHITECT_URL
        ? [{ source: "/:lang/architect/:path*", destination: process.env.ARCHITECT_URL.replace(/\/+$/, "") + "/:lang/architect/:path*", permanent: false }]
        : []),
    ]
  },

  // The build moment is computed once, here: `/api/health` reports when the site
  // was BUILT, not when the process started.
  env: {
    NEXT_PUBLIC_BUILT_AT: new Date().toISOString(),
  },
}

export default nextConfig
