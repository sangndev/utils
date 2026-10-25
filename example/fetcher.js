import { createFetcher } from '../src/create-fetcher'

const fetch = createFetcher({
  baseUrl: 'https://example.com',
  onError: (key, error) => console.log(key + ': ' + error.message),
  onSuccess: (key, data) => console.log(key + ': ' + data),
  use: [
    (config) => {
      config.foo = 'bar'
      return config
    },
    (config) => {
      config.bar = 'baz'
      return config
    }
  ]
})

const response = await fetch.get('/')
