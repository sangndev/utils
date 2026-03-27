import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

test('package entrypoint works for ESM import', async () => {
  const mod = await import('@sangndev/utils')
  assert.equal(typeof mod.deepEqual, 'function')
  assert.equal(mod.deepEqual({ a: 1 }, { a: 1 }), true)
})

test('package entrypoint works for CJS require', () => {
  const require = createRequire(import.meta.url)
  const mod = require('@sangndev/utils')
  assert.equal(typeof mod.deepEqual, 'function')
  assert.equal(mod.deepEqual({ a: 1 }, { a: 1 }), true)
})

