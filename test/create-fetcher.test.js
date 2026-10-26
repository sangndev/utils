import assert from 'node:assert/strict'
import test from 'node:test'

import { createFetcher } from '../src/create-fetcher/create-fetcher.js'

async function withMockFetch(mockFetch, callback) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = mockFetch

  try {
    return await callback()
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('creates all HTTP method functions', () => {
  const fetcher = createFetcher()

  assert.equal(typeof fetcher.get, 'function')
  assert.equal(typeof fetcher.post, 'function')
  assert.equal(typeof fetcher.put, 'function')
  assert.equal(typeof fetcher.patch, 'function')
  assert.equal(typeof fetcher.delete, 'function')
})

test('GET returns parsed data and calls onSuccess', async () => {
  const successCalls = []
  let requestedUrl

  await withMockFetch(async (url, init) => {
    requestedUrl = url
    assert.equal(init.method, 'GET')
    return new Response(JSON.stringify({ status: 'ok', method: 'GET' }))
  }, async () => {
    const fetcher = createFetcher({
      baseUrl: 'https://dummyjson.com',
      onSuccess: (key, result) => successCalls.push({ key, result })
    })

    const result = await fetcher.get('/test')

    assert.deepEqual(result.parsedData, { status: 'ok', method: 'GET' })
    assert.equal(result.response.ok, true)
    assert.equal(successCalls.length, 1)
    assert.equal(successCalls[0].key, 'https://dummyjson.com/test')
    assert.equal(successCalls[0].result.response, result.response)
  })

  assert.equal(requestedUrl, 'https://dummyjson.com/test')
})

test('supports an object URL with a custom callback key', async () => {
  const successKeys = []

  await withMockFetch(async () => new Response('{}'), async () => {
    const fetcher = createFetcher({
      baseUrl: 'https://api.example.test',
      onSuccess: (key) => successKeys.push(key)
    })

    await fetcher.get({ key: 'user-cache-key', url: '/users/1' })

    assert.deepEqual(successKeys, ['user-cache-key'])
  })
})

test('adds configured and request query parameters', async () => {
  let requestedUrl

  await withMockFetch(async (url) => {
    requestedUrl = url
    return new Response('{}')
  }, async () => {
    const fetcher = createFetcher({
      baseUrl: 'https://api.example.test',
      queryParams: { shared: 'config', page: 1 }
    })

    await fetcher.get('', {
      queryParams: { shared: 'request', search: 'hello world' }
    })
  })

  assert.equal(
    requestedUrl,
    'https://api.example.test?shared=request&page=1&search=hello+world'
  )
})

test('serializes json and forwards other request options', async () => {
  let request

  await withMockFetch(async (url, init) => {
    request = { url, init }
    return new Response('{}')
  }, async () => {
    const fetcher = createFetcher({ baseUrl: 'https://api.example.test' })

    await fetcher.post('/users', {
      json: { name: 'Ada' },
      headers: { 'content-type': 'application/json' },
      credentials: 'include'
    })
  })

  assert.equal(request.url, 'https://api.example.test/users')
  assert.equal(request.init.method, 'POST')
  assert.equal(request.init.body, JSON.stringify({ name: 'Ada' }))
  assert.deepEqual(request.init.headers, { 'content-type': 'application/json' })
  assert.equal(request.init.credentials, 'include')
})

test('runs synchronous and asynchronous middleware in order', async () => {
  const middlewareCalls = []
  let request

  await withMockFetch(async (url, init) => {
    request = { url, init }
    return new Response('{}')
  }, async () => {
    const fetcher = createFetcher({
      baseUrl: 'https://api.example.test',
      use: [
        (context) => {
          middlewareCalls.push('first')
          return { ...context, headers: { 'x-first': 'yes' } }
        },
        async (context) => {
          middlewareCalls.push('second')
          return { ...context, methodSpecific: true }
        }
      ]
    })

    await fetcher.get('/middleware')
  })

  assert.deepEqual(middlewareCalls, ['first', 'second'])
  assert.deepEqual(request.init.headers, { 'x-first': 'yes' })
  assert.equal(request.init.methodSpecific, true)
})

test('uses the request timeout and combines a caller signal', async () => {
  let requestSignal
  const callerController = new AbortController()

  await withMockFetch(async (_url, init) => {
    requestSignal = init.signal
    return new Response('{}')
  }, async () => {
    const fetcher = createFetcher({ baseUrl: 'https://api.example.test' })
    await fetcher.get('/signals', {
      timeout: 1000,
      signal: callerController.signal
    })
  })

  assert.equal(requestSignal instanceof AbortSignal, true)
  assert.equal(requestSignal.aborted, false)
  callerController.abort()
  assert.equal(requestSignal.aborted, true)
})

test('returns null data and calls onError for a non-ok response', async () => {
  const response = new Response(JSON.stringify({ message: 'nope' }), {
    status: 404
  })
  let errorCall

  await withMockFetch(async () => response, async () => {
    const fetcher = createFetcher({
      baseUrl: 'https://api.example.test',
      onError: (key, error) => {
        errorCall = { key, error }
      }
    })

    const result = await fetcher.delete('/missing')

    assert.deepEqual(result, { parsedData: null, response: null })
  })

  assert.equal(errorCall.key, 'https://api.example.test/missing')
  assert.equal(errorCall.error, response)
})

test('returns null data and calls onError for a fetch failure', async () => {
  const error = new Error('network unavailable')
  let errorCall

  await withMockFetch(async () => {
    throw error
  }, async () => {
    const fetcher = createFetcher({
      baseUrl: 'https://api.example.test',
      onError: (key, receivedError) => {
        errorCall = { key, receivedError }
      }
    })

    const result = await fetcher.get('/offline')

    assert.deepEqual(result, { parsedData: null, response: null })
  })

  assert.equal(errorCall.key, 'https://api.example.test/offline')
  assert.equal(errorCall.receivedError, error)
})

test('uses the correct HTTP method for post, put, patch, and delete', async () => {
  const methods = ['post', 'put', 'patch', 'delete']
  const requests = []

  await withMockFetch(async (url, init) => {
    requests.push({ url, method: init.method })
    return new Response('{}')
  }, async () => {
    const fetcher = createFetcher({ baseUrl: 'https://api.example.test' })

    for (const method of methods) {
      await fetcher[method]('/resource')
    }
  })

  assert.deepEqual(
    requests,
    methods.map((method) => ({
      url: 'https://api.example.test/resource',
      method: method.toUpperCase()
    }))
  )
})
