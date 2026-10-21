// Extra documents for llms-full.txt (node step 451-5, owner 2026-10-11: llms-full.txt «не должен иметь абсолютно никаких
// сокращений сжатие»). Every file in `assets/llms-extra/<lang>/` (Markdown or text) is put into `lib/aio/llms-extra.generated.json`
// VERBATIM — byte for byte, no trimming — and `lib/aio/llms.ts` appends it to llms-full.txt after the pages. Generated at build so
// the running server never reads the disk: the standalone build has no `assets/`, and a revalidation would lose the documents.
// No folder or no files → an empty map, and llms-full.txt is the pages only, as before.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'assets', 'llms-extra')
const OUT = path.join(ROOT, 'lib', 'aio', 'llms-extra.generated.json')

const docs = {}
if (fs.existsSync(SRC)) {
  for (const lang of fs.readdirSync(SRC).sort()) {
    const dir = path.join(SRC, lang)
    if (!fs.statSync(dir).isDirectory()) continue
    docs[lang] = fs
      .readdirSync(dir)
      .filter((f) => /\.(md|txt)$/i.test(f))
      .sort()
      .map((file) => ({ file, text: fs.readFileSync(path.join(dir, file), 'utf8') }))
  }
}
const next = JSON.stringify(docs, null, 1) + '\n'
const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : ''
if (prev !== next) fs.writeFileSync(OUT, next)
const count = Object.values(docs).reduce((n, l) => n + l.length, 0)
console.log(`===LLMS_EXTRA_OK=== ${count} document(s) in ${Object.keys(docs).length} language(s)`)
