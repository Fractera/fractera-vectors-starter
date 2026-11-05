// 654-1: THE ELEMENT KEY'S TEST VECTOR — the same derivation lives in every store of the node (data, storage, vectors word for word;
// graph, memory and the core's installer keep the same function), so one fixed secret and id must give one fixed key everywhere. A copy
// that drifts would refuse every element of the node, or let a wrong key in — this guard stops the build first. Part of `prebuild`.
import { elementKeyOf, elementOf, isElementId } from '../lib/data-store/element-key.mjs'

const SECRET = 'fractera-test-secret'
const ROOT = 'root.J4UAgJ_XnToPRyXPKaG5TB69cVHfiWh8FomI5RRQNHI'
const fails = []
const ok = (cond, what) => { if (!cond) fails.push(what) }

ok(elementKeyOf('root', SECRET) === ROOT, 'the test vector changed (root)')
ok(elementOf(ROOT, SECRET) === 'root', 'a good key is not read')
ok(elementOf(`blocks.${ROOT.slice('root.'.length)}`, SECRET) === null, 'a key with a swapped id passes')
ok(elementOf(ROOT.slice(0, -1), SECRET) === null, 'a key with a cut mac passes')
ok(elementOf(ROOT, '') === null && elementOf(ROOT, undefined) === null, 'a key passes with no node secret')
ok(elementOf(ROOT, 'another-node-secret') === null, 'a key of another node passes')
ok(elementOf('root', SECRET) === null && elementOf('.x', SECRET) === null && elementOf(42, SECRET) === null, 'a key without a mac passes')
ok(!isElementId('../x') && !isElementId('Root') && !isElementId('a.b') && !isElementId('-a') && !isElementId(''), 'a bad element id is taken')
ok(elementKeyOf('../x', SECRET) === null, 'a key is made for a bad id')

if (fails.length) {
  console.error(`✗ check-element-key (654-1):\n  ${fails.join('\n  ')}`)
  process.exit(1)
}
console.log('✓ check-element-key: the element key matches its test vector and refuses 8 bad forms (654-1)')
