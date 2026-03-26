/**
 * @template T
 * @param {T} value
 * @param {WeakMap<object, any>} [cache]
 * @returns {T}
 */
export function deepClone(value, cache = new WeakMap()) {
  const valueType = Object.prototype.toString.call(value)
  // Handle primitive types and null/undefined
  if (value === null || typeof value !== 'object') {
    return value
  }

  // Handle circular references
  if (cache.has(value)) {
    return cache.get(value)
  }

  // Handle Date
  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags)
  }

  // Handle AbortSignal - keep the original signal
  if (value instanceof AbortSignal) {
    return value
  }

  // Handle AbortSignal - keep the original signal
  if (value instanceof FormData) {
    return value
  }

  // Handle Map
  if (value instanceof Map) {
    const clonedMap = new Map()
    cache.set(value, clonedMap)
    value.forEach((val, key) => {
      clonedMap.set(deepClone(key, cache), deepClone(val, cache))
    })
    return clonedMap
  }

  // Handle Set
  if (value instanceof Set) {
    const clonedSet = new Set()
    cache.set(value, clonedSet)
    value.forEach((item) => {
      clonedSet.add(deepClone(item, cache))
    })
    return clonedSet
  }

  // Handle ArrayBuffer
  if (value instanceof ArrayBuffer) {
    return value.slice(0) // Clone ArrayBuffer by slicing it
  }

  // Handle Typed Arrays (Uint8Array, Int32Array, etc.)
  if (ArrayBuffer.isView(value)) {
    if (!(value.buffer instanceof ArrayBuffer)) {
      throw new Error(`Unsupported type: ${valueType}`)
    }
    const clonedBuffer = new value.constructor(value.buffer.slice(0))
    cache.set(value, clonedBuffer)
    return clonedBuffer
  }

  // Handle Array
  if (Array.isArray(value)) {
    const clonedArray = []
    cache.set(value, clonedArray)
    for (const item of value) {
      clonedArray.push(deepClone(item, cache))
    }
    return clonedArray
  }

  // Handle plain objects
  if (Object.prototype.toString.call(value) === '[object Object]') {
    const clonedObj = {}
    cache.set(value, clonedObj)
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        clonedObj[key] = deepClone(value[key], cache)
      }
    }
    return clonedObj
  }

  // Unsupported types
  throw new Error(`Unsupported type: ${valueType}`)
}
