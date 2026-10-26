import test from 'node:test'
import assert from 'node:assert/strict'

import { createFetcher } from '../src/create-fetcher/create-fetcher.js'

test('GET method', async () => {
  const fetcher = createFetcher({
    baseUrl: 'https://dummyjson.com',
    onSuccess(key, { parsedData }) {
      console.log('fetched data of ' + key + ' is ', parsedData)
    },
    onError(key, error) {
      if (error instanceof Response) {
        console.log('fetched error of ' + key + ' is ', error)
      }
    }
  })
  const { parsedData } = await fetcher.get('/test')
  assert.equal(
    JSON.stringify(parsedData),
    JSON.stringify({ status: 'ok', method: 'GET' })
  )
})
