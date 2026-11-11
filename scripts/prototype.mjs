// ПРОТОТИПЫ ДИЗАЙНА (узел, шаг 711-4, 711-6; свои секции прототипа — 717-3). Владелец 2026-11-09: «для каждого кандидата с референс
// сделать кнопку сгенерировать тестовую страницу … тестовой страницы сохраняются в проекте с ссылкой … выбрать текущий навык который
// будет использоваться в архитектуре записать его в own-service-props.json». Кнопку жмёт человек во вкладке ядра «Строительство →
// Дизайн»; работу делает агент этого элемента в проходе дизайна, этими командами:
//   npm run prototype -- new <id> --skill <mark> [--from home|<slug>] [--title "<name>"] [--ref <url> [--ref-caption "<words>"]]…
//        папка прототипа: слова исходной страницы, копия токенов (`DESIGN-CONFIG`), свой пустой набор секций (`sections/index.ts`),
//        запись прототипа — статус «draft»
//   npm run prototype -- done <id>     проверка (токены, DESIGN.md, слова без цвета, свой набор секций) и статус «ready»
//   npm run prototype -- list          прототипы элемента
//   npm run prototype -- index         проводка своих наборов прототипов (`_components/prototype-sections.ts`); её пишет и сборка
//   npm run design:pin -- <id>         победитель: его токены → DESIGN-CONFIG, DESIGN.md → элемент, его слова → исходная страница, его
//                                      свои секции → `components/sections/` со строками набора, паспорт: designSkill и design.pinned;
//                                      код секций проигравших уходит из дерева (его хранит git, запись называет коммит); все прототипы
//                                      уходят в архив без кода (снимки, слова, токены и записи остаются)
// Токены первыми, страница второй: всё, что видно на прототипе, — из его `tokens.json` и его секций; закрепляется ровно оно.
import { execFileSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { EMPTY_SET, ID, LANG, ROOT, SKILL_MARK, archiveDir, colourLeaks, designFile, elementSectionsDir, exists, pagesDir, passportFile, prototypeDir, readJson, recordProblems, sectionsDir, sourceDir, tokenProblems, writeWiring } from './prototype-lib.mjs'
import { addToSet, kindsOfPage, pageFolders, readSet, repeatedKinds, setFolders, setProblems } from './sections-lib.mjs'

const [cmd, id, ...rest] = process.argv.slice(2)
const flag = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] ?? '' : null }
const flags = (name) => rest.flatMap((v, i) => (v === name ? [rest[i + 1] ?? ''] : []))
const fail = (why) => { console.log(`===PROTOTYPE_FAIL=== ${why}`); process.exit(1) }
const write = (file, value) => { mkdirSync(join(file, '..'), { recursive: true }); writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8') }
const rel = (p) => relative(ROOT, p).split(sep).join('/')
// Пути с `[lang]` и `(protectedLayer)` — буквально, не шаблоном git.
const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, GIT_LITERAL_PATHSPECS: '1' }, stdio: ['ignore', 'pipe', 'pipe'] }).trim()

/** 717-3: what is wrong with a prototype's own sections — its set both ways, a repeated kind of the element, a kind its page names nowhere. */
function sectionProblems(pid) {
  const own = sectionsDir(pid)
  const label = `sections/`
  const out = [
    ...setProblems(own, label),
    ...repeatedKinds(own, elementSectionsDir()).map((k) => `${label}${k} repeats a section of the element — a prototype adds sections, it never replaces one: give the new look a new kind`),
  ]
  const known = new Set([...(readSet(elementSectionsDir())?.lines.keys() ?? []), ...(readSet(own)?.lines.keys() ?? [])])
  for (const k of kindsOfPage(prototypeDir(pid))) if (k.startsWith('section-') && k !== 'section-faq' && !known.has(k)) out.push(`the page names «${k}» — neither the element's set nor this prototype's own has it (its folder in ${label} and its line in ${label}index.ts)`)
  return out
}

if (cmd === 'list') {
  const root = pagesDir()
  const ids = existsSync(root) ? readdirSync(root).filter((n) => ID.test(n)) : []
  if (!ids.length) { console.log('===PROTOTYPE_LIST=== none'); process.exit(0) }
  for (const n of ids) { const p = readJson(join(root, n, 'prototype.json')); console.log(`${n} · ${p?.status ?? '?'} · ${p?.skill ?? '?'} · from ${p?.from ?? '?'} · own sections ${setFolders(sectionsDir(n)).length} · /<lang>/prototypes/${n}`) }
  process.exit(0)
}

if (cmd === 'index') {
  const changed = writeWiring()
  const sets = existsSync(pagesDir()) ? readdirSync(pagesDir()).filter((n) => ID.test(n) && readSet(sectionsDir(n))).length : 0
  console.log(`===PROTOTYPE_INDEX=== the prototypes' own sets: ${sets}${changed ? ' — app/[lang]/(protectedLayer)/prototypes/_components/prototype-sections.ts rewritten' : ''}`)
  process.exit(0)
}

if (!id || !ID.test(id)) fail('give the prototype id: lowercase letters, digits and dashes')
const dir = prototypeDir(id)

if (cmd === 'new') {
  if (exists(dir)) fail(`${id} exists — pick another id or regenerate inside it`)
  const skill = flag('--skill')
  if (!skill || !SKILL_MARK.test(skill)) fail('--skill <mark> is required (the skill the core handed to this element)')
  const from = flag('--from') || 'home'
  const src = sourceDir(from)
  if (!exists(src)) fail(`no source page «${from}» (home, or a folder of (publicLayer)/_pages)`)
  mkdirSync(dir, { recursive: true })
  for (const f of readdirSync(src)) if (LANG.test(f)) copyFileSync(join(src, f), join(dir, f))
  if (!existsSync(join(dir, 'en.json'))) write(join(dir, 'en.json'), { title: id, description: '', keywords: '', body: [] })
  write(join(dir, 'meta.json'), { order: Date.now() % 1_000_000 })
  write(join(dir, 'tokens.json'), readJson(designFile()) ?? {})
  mkdirSync(sectionsDir(id), { recursive: true })
  writeFileSync(join(sectionsDir(id), 'index.ts'), EMPTY_SET, 'utf8')
  writeWiring()
  const refs = flags('--ref').filter((u) => /^(https?:\/\/|\/)/.test(u)).map((url, i) => ({ url, ...(flags('--ref-caption')[i] ? { caption: flags('--ref-caption')[i] } : {}) }))
  const title = flag('--title')
  write(join(dir, 'prototype.json'), { id, skill, from, references: refs, status: 'draft', createdAt: new Date().toISOString(), ...(title ? { title } : {}) })
  console.log(`===PROTOTYPE_NEW=== ${id}: app/[lang]/(protectedLayer)/prototypes/_pages/${id}/ — the words of «${from}», a copy of the tokens, its own empty set of sections, ${refs.length} reference(s).
Next: write tokens.json FIRST (the whole look: colours of both themes, fonts from lib/design/local-fonts.json, type, shape, motion),
then DESIGN.md (the rules tokens cannot hold), then the page's words and sections — no colour in the words, only tokens. A section
the element has not: its folder in this prototype's sections/ and its line in sections/index.ts (the shape of components/sections/).
Then: npm run prototype -- done ${id}`)
  process.exit(0)
}

if (cmd === 'done') {
  if (!exists(dir)) fail(`no prototype ${id}`)
  const record = readJson(join(dir, 'prototype.json'))
  const problems = [
    ...recordProblems(record, id),
    ...tokenProblems(readJson(join(dir, 'tokens.json'))),
    ...(existsSync(join(dir, 'DESIGN.md')) ? [] : ['DESIGN.md is missing — the rules of the look that tokens cannot hold']),
    ...readdirSync(dir).filter((f) => LANG.test(f)).flatMap((f) => colourLeaks(readJson(join(dir, f)), f).map((l) => `a colour in the words, not in the tokens — ${l}`)),
    ...sectionProblems(id),
  ]
  const en = readJson(join(dir, 'en.json'))
  if (!Array.isArray(en?.body) || en.body.length === 0) problems.push('en.json has no body — the page is not built yet')
  if (problems.length) fail(`${id} is not ready:\n  ${problems.join('\n  ')}`)
  writeWiring()
  write(join(dir, 'prototype.json'), { ...record, status: 'ready', readyAt: new Date().toISOString() })
  console.log(`===PROTOTYPE_READY=== ${id}: /<lang>/prototypes/${id} — take the screenshots into its shots/ (desktop.png, mobile.png) and report to the core.`)
  process.exit(0)
}

if (cmd === 'pin') {
  if (!exists(dir)) fail(`no prototype ${id}`)
  const record = readJson(join(dir, 'prototype.json'))
  if (!record || !['ready', 'pinned'].includes(record.status)) fail(`${id} is «${record?.status ?? 'unknown'}» — only a ready prototype is pinned (npm run prototype -- done ${id})`)
  const tokens = readJson(join(dir, 'tokens.json'))
  const bad = tokenProblems(tokens)
  if (bad.length) fail(`${id}: ${bad.join('; ')}`)
  // 717-3: the sections are checked before anything moves — a refusal leaves the element as it was. The winner's own sections become
  // the element's; the losers' leave the tree, so git must hold them first (their records name the commit).
  const winners = setFolders(sectionsDir(id))
  const losers = readdirSync(pagesDir()).filter((n) => ID.test(n) && n !== id).map((n) => [n, setFolders(sectionsDir(n))]).filter(([, kinds]) => kinds.length)
  const problems = sectionProblems(id)
  let head = null
  if (losers.length) {
    try {
      const dirty = git(['status', '--porcelain', '--untracked-files=all', '--', ...losers.map(([n]) => rel(sectionsDir(n)))])
      if (dirty) problems.push(`commit the sections of the prototypes that lose first — they leave the tree at the pin, git keeps them:\n    ${dirty.split('\n').join('\n    ')}`)
      head = git(['rev-parse', 'HEAD'])
    } catch (e) {
      problems.push(`the pin needs git to keep the losers' sections: ${String(e?.message ?? e).split('\n')[0]}`)
    }
  }
  if (problems.length) fail(`${id} is not pinned — nothing moved:\n  ${problems.join('\n  ')}`)
  // Токены победителя — документ дизайна элемента; ветки, которых форма прототипа не знает (если появятся у другого писателя), остаются.
  const before = readJson(designFile()) ?? {}
  const next = { ...before }
  for (const k of ['colors', 'fonts', 'type', 'shape', 'motion']) { if (tokens[k] !== undefined) next[k] = tokens[k]; else delete next[k] }
  write(designFile(), next)
  if (existsSync(join(dir, 'DESIGN.md'))) copyFileSync(join(dir, 'DESIGN.md'), join(ROOT, 'DESIGN.md'))
  // Слова победителя — исходной странице: она и есть то, что сравнивали; её «ожидает дизайна» снимается.
  const src = sourceDir(record.from)
  const named = exists(src) ? kindsOfPage(src) : new Set()
  if (exists(src)) {
    for (const f of readdirSync(dir)) {
      if (!LANG.test(f)) continue
      const words = readJson(join(dir, f))
      const target = readJson(join(src, f)) ?? {}
      write(join(src, f), { ...target, body: words?.body ?? target.body ?? [] })
    }
    const meta = readJson(join(src, 'meta.json'))
    if (meta && meta.awaitingDesign) { delete meta.awaitingDesign; write(join(src, 'meta.json'), meta) }
  }
  const passport = readJson(passportFile()) ?? {}
  const at = new Date().toISOString()
  passport.designSkill = record.skill
  passport.design = { ...(passport.design ?? {}), skill: record.skill, pinned: { prototype: id, skill: record.skill, at, ...(record.references?.length ? { references: record.references } : {}) } }
  write(passportFile(), passport)
  // 717-3: the winner's own sections — folders into the element's set, with their import and line in components/sections/index.ts.
  for (const k of winners) { renameSync(join(sectionsDir(id), k), join(elementSectionsDir(), k)); addToSet(elementSectionsDir(), k) }
  // Все прототипы — в архив: победитель стал страницей, проигравшие — историей (запись, токены, DESIGN.md, слова, снимки). Кода в
  // архиве нет: свои секции победителя уже у элемента, проигравших — в git (запись называет их и коммит).
  mkdirSync(archiveDir(), { recursive: true })
  for (const n of readdirSync(pagesDir()).filter((x) => ID.test(x))) {
    const from = join(pagesDir(), n)
    const rec = readJson(join(from, 'prototype.json')) ?? {}
    const kinds = n === id ? winners : (losers.find(([m]) => m === n)?.[1] ?? [])
    const code = !kinds.length ? {} : n === id ? { sections: kinds, sectionsMovedTo: 'components/sections/' } : { sections: kinds, sectionsAt: head }
    write(join(from, 'prototype.json'), { ...rec, status: n === id ? 'pinned' : 'archived', closedAt: at, ...code })
    rmSync(join(from, 'sections'), { recursive: true, force: true })
    const to = join(archiveDir(), n)
    if (existsSync(to)) rmSync(to, { recursive: true, force: true })
    try { renameSync(from, to) } catch { cpSync(from, to, { recursive: true }); rmSync(from, { recursive: true, force: true }) }
  }
  writeWiring()
  // The sections the source page named before the pin and no page names now — the old look; the agent decides, nothing is deleted.
  const still = new Set(pageFolders(join(ROOT, 'app', '[lang]')).flatMap((d) => [...kindsOfPage(d)]))
  const set = readSet(elementSectionsDir())
  const unused = [...named].filter((k) => set?.lines.has(k) && !still.has(k) && k !== 'section-faq')
  const lost = losers.map(([n, kinds]) => `${n} (${kinds.join(', ')})`)
  console.log(`===DESIGN_PINNED=== ${id} (${record.skill}): its tokens are DESIGN-CONFIG/design-config.json, DESIGN.md is at the element's root,
its words are the page «${record.from}», the passport names the skill and the pin; the prototypes are archived.
Its own sections are the element's now: ${winners.length ? winners.map((k) => `components/sections/${k}/`).join(', ') : 'none'}.
${lost.length ? `The losers' sections left the tree — git keeps them at ${head?.slice(0, 7)}: ${lost.join('; ')}.\n` : ''}${unused.length ? `No page names ${unused.join(', ')} any more — delete its folder and its line in components/sections/index.ts if nothing needs it.\n` : ''}Next: npm run describe:publish, commit, then «Preview & Deploy».`)
  process.exit(0)
}

fail('commands: new <id> --skill <mark> [--from home|<slug>] · done <id> · list · index · pin <id> (npm run design:pin -- <id>)')
