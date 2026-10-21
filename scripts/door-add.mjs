// A NEW DOOR FOR THE NODE (node step 548-16).
//
//   npm run door:add -- <name> --says "<what the door does, 6 to 12 words>" [--method POST|GET]
//
// The owner of the node chose this recipe on 2026-10-20 to make building cheaper: one small door cost an element 65 requests
// (9.4 M tokens, journal of y7jos, node step 548-14), and about 17 of them went on finding out how a door is protected, listed
// and described. This command does that part, so the agent writes only the work itself:
//   app/api/<name>/route.ts          — the door: the `// @api` line, the node key (`lib/node-key.ts`), JSON in and out
//   app/api/<name>/<name>.mjs        — `handle(input)`: the work, the only file the agent fills in
//   app/api/<name>/<name>.test.mjs   — samples of `handle` (`npm run test:<name>`)
//   scripts/check-routes.mjs         — the door in the closed list of routes
//   package.json                     — the script `test:<name>`
//   OWN-SERVICE-PROPS/A2A-CARD.json  — the door in the card (`doors`, key `node-key` — the header X-Node-Key) and its skill «Not over A2A: an HTTP door»
// 🔒 A name that is taken (folder, route list, card) is refused before anything is written. Each edited file keeps its line ends.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)
const flag = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const fail = (msg) => { console.error(`===DOOR_FAILED=== ${msg}`); process.exit(1) }

const name = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')))
const says = (flag('says') ?? '').trim().replace(/\s+/g, ' ')
const method = (flag('method') ?? 'POST').toUpperCase()

if (!name || !/^[a-z][a-z0-9-]{1,39}$/.test(name)) fail('door:add -- <name> --says "<6-12 words>" [--method POST|GET]; the name: lowercase latin letters, digits, hyphens')
const words = says ? says.split(' ').length : 0
if (words < 6 || words > 12) fail(`--says needs 6 to 12 words (now ${words}): what the door does, the way check:api reads it`)
if (!['POST', 'GET'].includes(method)) fail('--method is POST or GET')

const route = `app/api/${name}/route.ts`
const routesFile = join(root, 'scripts', 'check-routes.mjs')
const cardFile = join(root, 'OWN-SERVICE-PROPS', 'A2A-CARD.json')
const pkgFile = join(root, 'package.json')

const readKeep = (file) => { const text = readFileSync(file, 'utf8'); return { text, eol: text.includes('\r\n') ? '\r\n' : '\n' } }
const routes = readKeep(routesFile)
const card = readKeep(cardFile)
const pkg = readKeep(pkgFile)
const cardJson = JSON.parse(card.text)
const pkgJson = JSON.parse(pkg.text)
const ext = (cardJson.capabilities?.extensions ?? []).find((e) => e.uri === 'https://fractera.ai/a2a/ext/node/v1')?.params
if (!ext || !Array.isArray(ext.doors)) fail('OWN-SERVICE-PROPS/A2A-CARD.json has no node extension with doors')

if (existsSync(join(root, 'app', 'api', name))) fail(`app/api/${name} already exists`)
if (routes.text.includes(`'${route}'`)) fail(`${route} is already in scripts/check-routes.mjs`)
if (ext.doors.some((d) => d.path === `/api/${name}`)) fail(`/api/${name} is already a door in the card`)
if (pkgJson.scripts?.[`test:${name}`]) fail(`package.json already has test:${name}`)
const close = routes.text.indexOf(`${routes.eol}])`)
if (close < 0) fail('the closed list of routes (const ALLOWED = new Map([ … ])) was not found in scripts/check-routes.mjs')

const input = method === 'POST'
  ? `  let input: unknown${'\n'}  try { input = await req.json() } catch {${'\n'}    return NextResponse.json({ error: "bad_request", reason: "the body must be JSON" }, { status: 400, headers: NO_STORE })${'\n'}  }`
  : '  const input = Object.fromEntries(req.nextUrl.searchParams)'

const routeTs = `// @api ${says}
import { NextRequest, NextResponse } from "next/server"
import { needNodeKey, nodeKeyOk, NO_STORE } from "@/lib/node-key"
import { handle } from "./${name}.mjs"

// DOOR ${name} — made by \`npm run door:add\` (node step 548-16). The other elements of the node call it on the machine's loopback
// (http://127.0.0.1:<port>/api/${name}) with the header X-Node-Key; the gate of proxy.ts lets the loopback through, the key decides
// here. The work is \`handle()\` in ./${name}.mjs — this file only checks the key and turns JSON in and out.
export const dynamic = "force-dynamic"

export async function ${method}(req: NextRequest) {
  if (!nodeKeyOk(req.headers.get("x-node-key"))) return needNodeKey()
${input}
  const { status, body } = await handle(input)
  return NextResponse.json(body, { status, headers: NO_STORE })
}
`

const handleMjs = `// The work of the door ${method} /api/${name}: ${says}.
// Gets what the caller sent (${method === 'POST' ? 'the JSON body' : 'the query string as an object'}), returns { status, body }:
// 200 with the result, 400 or 422 with { error, reason } for input it cannot use. Pure: no request, no key — route.ts does that.
export async function handle(input) {
  // TODO: the work of the door — replace this line and keep the shape { status, body }.
  return { status: 501, body: { error: 'not_built', reason: 'the door ${name} is not built yet' } }
}
`

const testMjs = `// Samples of the door ${name} (\`npm run test:${name}\`): exit code 1 on any miss.
import { handle } from './${name}.mjs'

let failures = 0
const expect = async (label, input, want) => {
  const got = await handle(input)
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) failures++
  console.log(\`\${ok ? 'ok  ' : 'FAIL'} \${label}\${ok ? '' : \`\\n     got  \${JSON.stringify(got)}\\n     want \${JSON.stringify(want)}\`}\`)
}

// TODO: real samples — what a caller sends and what it must get back, and one input the door refuses.
await expect('not built yet', {}, { status: 501, body: { error: 'not_built', reason: 'the door ${name} is not built yet' } })

if (failures) { console.error(\`===TEST_${name.toUpperCase().replace(/-/g, '_')}_FAILED=== \${failures}\`); process.exit(1) }
console.log('===TEST_${name.toUpperCase().replace(/-/g, '_')}_OK===')
`

// Everything is checked — now write.
mkdirSync(join(root, 'app', 'api', name), { recursive: true })
writeFileSync(join(root, route), routeTs, 'utf8')
writeFileSync(join(root, 'app', 'api', name, `${name}.mjs`), handleMjs, 'utf8')
writeFileSync(join(root, 'app', 'api', name, `${name}.test.mjs`), testMjs, 'utf8')

const quoted = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const line = `  [${quoted(route)}, ${quoted(`door ${name}: ${says} (door:add, node step 548-16)`)}],`
writeFileSync(routesFile, routes.text.slice(0, close) + routes.eol + line + routes.text.slice(close), 'utf8')

pkgJson.scripts[`test:${name}`] = `node app/api/${name}/${name}.test.mjs`
writeFileSync(pkgFile, JSON.stringify(pkgJson, null, 2).replace(/\n/g, pkg.eol) + pkg.eol, 'utf8')

ext.doors.push({
  // 551-2: the key is a word of the core's closed list (lib/a2a/passport.mjs: none · session · X-Data-Secret · X-Settings-Key · node-key);
  // ✗ «X-Node-Key» here broke the card of every element that built a door with this recipe (548-19 → found 2026-10-20).
  skill: name, protocol: 'http', method, path: `/api/${name}`, key: 'node-key',
  input: {}, output: {}, errors: { 401: 'bad_key', ...(method === 'POST' ? { 400: 'bad_request' } : {}) }, callers: [],
})
cardJson.skills = Array.isArray(cardJson.skills) ? cardJson.skills : []
cardJson.skills.push({
  id: name,
  name: says.charAt(0).toUpperCase() + says.slice(1),
  description: `${says}. Not over A2A: an HTTP door — ${method} /api/${name} (extension https://fractera.ai/a2a/ext/node/v1, «doors»)`,
  tags: ['http-door'],
  examples: [],
  inputModes: ['application/json'],
  outputModes: ['application/json'],
})
writeFileSync(cardFile, JSON.stringify(cardJson, null, 2).replace(/\n/g, card.eol) + card.eol, 'utf8')

console.log(`===DOOR_OK=== ${method} /api/${name}`)
console.log(`Left for you:
  1. app/api/${name}/${name}.mjs — write handle(input); keep { status, body }.
  2. app/api/${name}/${name}.test.mjs — real samples, then: npm run test:${name}
  3. OWN-SERVICE-PROPS/A2A-CARD.json — door «${name}»: a real input/output sample, the errors you return, callers (element ids);
     the skill «${name}»: examples and tags.
  4. OWN-SERVICE-PROPS/OWN-SERVICE-PROPS.json — what this element now accepts and returns (skill passport-description).
  5. One commit, then npm run describe:publish — the core's registry learns the door.`)
