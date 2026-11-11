// test:design-brief (706-4) — форма брифа дизайна, без сервера (Node 22 снимает типы сам).
import { normalizeBrief, mergeBrief, BRIEF_SCHEMA } from './design-brief-shape.ts'
let bad = 0
const ok = (c, w) => { console.log(`${c ? '✓' : '✗'} ${w}`); if (!c) bad++ }
const good = normalizeBrief({ skill: 'frontend-design', audience: '  partner   engineers ', character: ['strict', 'calm'], references: [{ url: 'https://stripe.com', note: 'tone' }, { media: 'abc' }, {}], avoid: 'gradients' })
ok(good.ok && good.brief.audience === 'partner engineers' && good.brief.references.length === 2, 'a valid brief passes, spaces folded, empty reference dropped')
ok(normalizeBrief({}).ok && normalizeBrief({}).brief === null, 'an empty brief is null')
ok(!normalizeBrief({ character: ['a', 'b', 'c', 'd', 'e', 'f'] }).ok, 'six character words are refused')
ok(!normalizeBrief({ references: [{ url: 'javascript:alert(1)' }] }).ok, 'a non-http link is refused')
ok(!normalizeBrief({ skill: 'Not A Skill' }).ok, 'a skill of the wrong shape is refused')
ok(!normalizeBrief({ references: new Array(13).fill({ note: 'x' }) }).ok, 'thirteen references are refused')
ok(!normalizeBrief('text').ok, 'a brief that is not an object is refused')
// 712-1: the core's patch keeps what it did not send, `null` removes, and the declaration names the fields the core may show.
const pinned = { prototype: 'dna-k9x2', skill: 'design-dna', at: '2026-11-09T18:00:00Z' }
const merged = normalizeBrief(mergeBrief({ audience: 'engineers', avoid: 'gradients', pinned }, { audience: 'designers', avoid: null }))
ok(merged.ok && merged.brief.audience === 'designers' && merged.brief.avoid === undefined && merged.brief.pinned?.prototype === 'dna-k9x2', 'a patch changes one field, null removes one, the pin stays')
ok(!normalizeBrief(mergeBrief({}, { character: ['a', 'b', 'c', 'd', 'e', 'f'] })).ok, 'a patch is still checked by the brief shape')
ok(BRIEF_SCHEMA.properties.audience.type === 'string' && BRIEF_SCHEMA.properties.character.type === 'array' && !('url' in BRIEF_SCHEMA.properties), 'the declaration names the brief fields and nothing else')
if (bad) { console.log(`===DESIGN_BRIEF_FAILED=== ${bad}`); process.exit(1) }
console.log('===DESIGN_BRIEF_OK===')
