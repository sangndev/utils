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

import { getPath, walkMiddlewares } from './utils.js'

/** @typedef {Omit<RequestInit, 'method'>} FetcherRequestInit */

/**
 * @typedef {Object} FetcherConfigs
 * @property {string} [baseUrl]
 * @property {number} [timeout]
 * @property {(key: string, data: any) => Promise<void> | void} [onSuccess]
 * @property {(key: string, error: Error | Response) => Promise<void> | void} [onError]
 * @property {Array<import('./utils.js').MiddlewareFn<FetcherRequestInit>} [use]
 * @property {unknown} [cache]
 * */
/** @param {FetcherConfigs} configs  */
function createFetcher(configs) {
  const {
    baseUrl = '',
    use = [],
    onSuccess,
    onError,
    timeout = 60 * 1000 /* 1 minute */
  } = configs ?? {}
  /** @typedef { string | {key: string; url: string }} FirstArg */
  /**
   * @param {FirstArg} arg1
   * @param {FetcherRequestInit & {
   *	queryParam?: Record<string, string | number>
   *	timeout?: number
   *	[key: string]: any
   * }} req
   * */
  async function queryFunction(arg1, req) {
    const { queryParam, ...restRequest } = req

    const isObj = typeof arg1 === 'object' && arg1 !== null
    const path = isObj ? arg1.url : arg1
    const url = getPath(baseUrl + path, req.queryParam)
    const key = isObj ? arg1.key : url

    if (typeof arg1 === 'object') {
      key = arg1.key
    }

    try {
      const {
        signal,
        timeout: lTimeout,
        ...lastConfigs
      } = await walkMiddlewares(use, restRequest)

      const timeoutSignal = AbortSignal.timeout(lTimeout ? lTimeout : timeout)

      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.any([timeoutSignal, signal]),
        ...lastConfigs
      })

      if (!response.ok) {
        throw response
      }
      if (onSuccess) onSuccess(key, response)
      return response
    } catch (error) {
      if (onError) onError(key, error)
      throw error
    }
  }
  /**
   * @param {"POST" | "PUT" | "DELETE"} method
   * */
  async function mutateFunction(method) {
    return function (url, req) {}
  }

  return {
    get: queryFunction,
    post: mutateFunction,
    put: mutateFunction,
    delete: queryFunction
  }
}

export { createFetcher }
