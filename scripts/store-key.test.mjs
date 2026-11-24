// Samples of the native element's store key (node step 857, lib/fractera/store-key.mjs): exit code 1 on any miss.
// A native element preinstalled with the node opens the stores with the node's key; one BORN on a node (kind `user`, DATA_SECRET withheld
// by the installer) with its own ELEMENT_KEY. Before 857 it read only DATA_SECRET and had no key at all — the negative control below.
import assert from 'node:assert/strict'
import { storeHeaders, storeScope } from '../lib/fractera/store-key.mjs'

let passed = 0
const t = (name, fn) => {
  try { fn(); passed += 1; console.log(`  ✓ ${name}`) } catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1 }
}

t('preinstalled native: the node key first, even with an own key beside it', () => {
  assert.deepEqual(storeHeaders({ DATA_SECRET: 'node', ELEMENT_KEY: 'cck60.mac' }), { 'X-Data-Secret': 'node' })
  assert.deepEqual(storeHeaders({ DATA_API_KEY: 'laptop' }), { 'X-Data-Secret': 'laptop' })
})

t('born on a node: DATA_SECRET empty → its own ELEMENT_KEY', () => {
  const h = storeHeaders({ DATA_SECRET: '', ELEMENT_KEY: 'cck60.mac' })
  assert.deepEqual(h, { 'X-Element-Key': 'cck60.mac' })
  assert.equal(storeScope(h), 'element cck60')
})

t('negative control: the pre-857 rule (DATA_SECRET only) gives a born native no key', () => {
  const old = (env) => { const k = String(env.DATA_API_KEY || env.DATA_SECRET || '').trim(); return k ? { 'X-Data-Secret': k } : {} }
  assert.deepEqual(old({ DATA_SECRET: '', ELEMENT_KEY: 'cck60.mac' }), {})
  assert.deepEqual(storeHeaders({}), {})
  assert.equal(storeScope({}), 'none')
})

console.log(process.exitCode ? `===STORE_KEY_TEST_FAILED=== ${passed} passed` : `===STORE_KEY_TEST_OK=== ${passed} passed`)
