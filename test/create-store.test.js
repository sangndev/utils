import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createStore,
  getOriginalObject,
  subscribe
} from '../src/create-store.js'

const flushBatches = () => Promise.resolve()

test('subscribe (primitive) notifies with the new value', async () => {
  const state = createStore({ count: 0 })

  /** @type {unknown[]} */
  const records = []
  subscribe(state, 'count', (value) => records.push(value))

  state.count = 1
  await flushBatches()

  assert.deepEqual(records, [1])
})

test('subscribe (primitive) does not notify when setting the same value', async () => {
  const state = createStore({ count: 1 })

  let calls = 0
  subscribe(state, 'count', () => calls++)

  state.count = 1
  await flushBatches()

  assert.equal(calls, 0)
})

test('subscribe (object) notifies on nested mutations and passes the original object', async () => {
  const state = createStore({ nested: { value: 0 } })

  /** @type {any} */
  let record
  subscribe(state, 'nested', (obj) => {
    record = obj
  })

  state.nested.value = 2
  await flushBatches()

  assert.equal(record.value, 2)
  assert.equal(record, getOriginalObject(state.nested))
})

test('unsubscribe removes only the subscribed handler', async () => {
  const state = createStore({ count: 0 })

  let callsA = 0
  let callsB = 0

  const unsubA = subscribe(state, 'count', () => callsA++)
  subscribe(state, 'count', () => callsB++)

  unsubA()

  state.count = 1
  await flushBatches()

  assert.equal(callsA, 0)
  assert.equal(callsB, 1)
})

test('getOriginalObject returns the underlying target for proxies', () => {
  const state = createStore({ count: 1 })
  const original = getOriginalObject(state)

  assert.notEqual(original, state)
  assert.equal(original.count, 1)
  assert.equal(getOriginalObject(original), original)
})

test('subscribe (array) notifies on index assignment and passes the original array', async () => {
  const state = createStore({ list: [1, 2, 3] })

  /** @type {any} */
  let record
  let calls = 0
  subscribe(state, 'list', (arr) => {
    calls++
    record = arr
  })

  state.list[1] = 42
  await flushBatches()

  assert.equal(calls, 1)
  assert.equal(record[1], 42)
  assert.equal(record, getOriginalObject(state.list))
})

test('createStore can wrap arrays directly and subscribe to indices', async () => {
  const list = createStore([10, 20])

  /** @type {unknown[]} */
  const records = []
  subscribe(list, 0, (value) => records.push(value))

  list[0] = 99
  await flushBatches()

  assert.deepEqual(records, [99])
})
