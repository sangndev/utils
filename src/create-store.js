/** @typedef {(record: unknown) => void} Handler*/
/** @typedef {string | number | symbol} Key*/
/** @typedef {(params: {path: Key; newValue: unknown; target: object}) => void} NotifyUpdateFn*/

/**
 * Reactive store built on top of `Proxy`.
 *
 * - `createStore(obj)` wraps a plain object/array and returns a proxy that can
 *   track nested objects lazily (nested values are proxied on access).
 * - `subscribe(store, key, handler)` subscribes to changes:
 *   - If `store[key]` is a primitive, `handler(newValue)` is called when that
 *     property changes.
 *   - If `store[key]` is a plain object/array, `handler(targetObject)` is
 *     called when *any* nested property on that object changes.
 * - Notifications are batched per microtask to avoid redundant handler calls
 *   when multiple writes happen synchronously.
 *
 * Notes:
 * - Only plain objects and arrays are proxied (class instances are ignored).
 * - Deletes currently do not trigger notifications.
 */

import { deepEqual } from './deep-equal.js'

/** @type {WeakMap<object, Map<Key, Handler[]>>}*/
const subscriberStore = new WeakMap()
const refSet = new WeakSet()
const GET_ORIGINAL = Symbol('GET_ORIGINAL')
const GET_SELF = Symbol('__self__')
const objectIs = Object.is
/** @type {Array<{handler: Handler; record: unknown}>}*/
let handleBatch = []

let batchScheduled = false

/**
 * @template T
 * @param {T} obj
 * @param {boolean} registerStateToStore
 * @returns {T}
 * */
export function createStore(obj, registerStateToStore = false) {
  // Notify update of listener
  /** @type {NotifyUpdateFn} */
  const notifyUpdate = (params) => {
    const { path, newValue, target: originObject } = params
    const subscriber = subscriberStore.get(originObject)

    if (subscriber) {
      const handlers = subscriber.get(path)
      const selfHandlers = subscriber.get(GET_SELF)
      if (handlers && handlers.length > 0) {
        // Dispatch all handlers with batching
        dispatchAllHandlers(handlers, newValue)
      }
      if (selfHandlers && selfHandlers.length > 0) {
        // Dispatch all self handlers with batching
        dispatchAllHandlers(selfHandlers, originObject)
      }
    }
  }

  const subscriber = subscriberStore.get(obj)

  // Create handler for proxy object
  const handlers = createDefaultHandler(obj, notifyUpdate)

  // Register object to subscribers store if it haven't registed yet
  if (!subscriber && registerStateToStore) {
    subscriberStore.set(obj, new Map())
  }

  return new Proxy(obj, handlers)
}

/**
 * @template T
 * @param {T} obj
 * @param {keyof T} key
 * @param {Handler} handler
 * @returns {Function}
 */
export function subscribe(obj, key, handler) {
  const nextValue = obj[key]
  const nextValueOriginal = getOriginalObject(nextValue)
  const objectOriginal = getOriginalObject(obj)

  // Determine which symbol/key to use based on whether value is an object
  const subscribeKey = canProxy(nextValueOriginal) ? GET_SELF : key
  const target = canProxy(nextValueOriginal)
    ? nextValueOriginal
    : objectOriginal

  // Get or create subscriber map
  let subscriber = subscriberStore.get(target)

  if (!subscriber) {
    subscriber = new Map()
    subscriberStore.set(target, subscriber)
  }

  // Add handler to subscriber
  const handlers = subscriber.get(subscribeKey) ?? []
  handlers.push(handler)

  subscriber.set(subscribeKey, handlers)

  // Unsubscribe function
  return () => {
    const list = subscriber.get(subscribeKey)
    if (!list) return

    const index = list.indexOf(handler)
    if (index !== -1) list.splice(index, 1)

    if (list.length === 0) subscriber.delete(subscribeKey)
  }
}

/**
 *  Return the plain object
 *
 * @template T
 * @param {T} obj
 * @returns {T}
 */
export function getOriginalObject(obj) {
  if (!isObject(obj)) return obj
  return obj[GET_ORIGINAL] ?? obj
}

/**
 * @param {object} obj
 * @returns boolean
 */
function isObject(obj) {
  return typeof obj === 'object' && obj !== null
}

/**
 * @param {object} obj
 * @returns boolean
 */
function canProxy(obj) {
  if (
    !isObject(obj) ||
    (obj.constructor && !['Object', 'Array'].includes(obj.constructor.name))
  ) {
    return false
  }
  return true
}

/**
 * @param {object} obj
 * @param {WeakSet<object>} [cached]
 * @returns
 */
function deepClone(obj, cached = refSet) {
  if (!isObject(obj) || cached.has(obj)) {
    return obj
  }

  const baseObject = Array.isArray(obj)
    ? []
    : Object.create(Object.getPrototypeOf(obj))

  Reflect.ownKeys(obj).forEach((key) => {
    baseObject[key] = deepClone(obj[key], cached)
  })

  return baseObject
}

/**
 * @param {Handler[]} handlers
 * @param {*} record
 * @returns void
 */
function dispatchAllHandlers(handlers, record) {
  if (!handlers || handlers.length === 0) return

  // Add all handlers to the batch queue
  for (const handler of handlers) {
    handleBatch.push({ handler, record })
  }

  // Schedule batch execution once per microtask cycle
  if (!batchScheduled) {
    batchScheduled = true
    Promise.resolve().then(() => {
      const batch = handleBatch
      handleBatch = []
      batchScheduled = false

      // Execute all handlers in the batch
      for (const { handler, record } of batch) {
        try {
          handler(record)
        } catch (error) {
          console.error('Error executing handler:', error)
        }
      }
    })
  }
}

/**
 * @param {object} obj
 * @param {NotifyUpdateFn} notifyUpdate
 * @returns {ProxyHandler}
 */
function createDefaultHandler(obj, notifyUpdate) {
  return {
    get(target, p, receiver) {
      if (p === GET_ORIGINAL) {
        return obj
      }

      const nextTarget = Reflect.get(target, p, receiver)
      if (canProxy(nextTarget)) {
        return createStore(nextTarget, true)
      }

      return nextTarget
    },
    set(target, p, newValue, receiver) {
      const prevValue = Reflect.get(target, p, receiver)

      // Do nothing if new value is equal to previous value
      if (objectIs(prevValue, newValue)) return true // Primitive value
      if (deepEqual(prevValue, newValue)) return true // Object type value

      // Notify subscriber to update new value
      notifyUpdate({
        path: p,
        newValue: newValue,
        target: target
      })

      Reflect.set(target, p, newValue, receiver)

      return true
    },
    deleteProperty(target, p) {
      Reflect.deleteProperty(target, p)
      return true
    }
  }
}
