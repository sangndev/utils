/**
 * @author sangndev
 * @version 1.0
 *
 * @fileoverview A simple api-fetcher with fully support (cache, actions-handling, error catch, middleware, ...)
 *
 * @example
 * const fetcherStore = new Map()
 *
 * const exampleFetcher = createFetcher({
 *		basePath: 'https://example.com',
 *		use: [middleware1, middleware2], // Middleware
 *		onSuccess: function(key, response) { // Handling success action },
 *		onError: function(key, response) { // Handling error action },
 *		cache: buildStorage(fetcherStore, {ttl: 24 * 60 * 60}), // or you can use localStorage too buildStorage(localStorage, {ttl: ...})
 * })
 *
 * const {data, error} = await exampleFetcher.get('https://example.com/product/:id', {
 *		searchParams: {
 *			id: 'example-id'
 *		},
 *		queryParams: {
 *			status: 'example-status'
 *		},
 *	})
 */

/**
 * @typedef {Object} FetcherConfigs
 * @property {string} [baseUrl]
 * @property {(key: string, data: any) => Promise<void> | void} [onSuccess]
 * @property {(key: string, error: Error) => Promise<void> | void} [onError]
 * @property {Array<import('./create-fetcher-middleware.js').FetcherMiddleware>} [use]
 * @property {unknown} [cache]
 * */
/** @param {FetcherConfigs} configs  */
function createFetcher(configs) {
  async function queryFunction() {}
  async function mutateFunction() {}
  return {
    get: queryFunction,
    post: mutateFunction,
    put: mutateFunction,
    delete: queryFunction
  }
}

/** @param {FetcherConfigs} configs */
function setupConfigs(configs) {}

export { createFetcher }
