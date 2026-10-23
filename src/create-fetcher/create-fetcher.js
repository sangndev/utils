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
 * @property {(key: string, data: any) => Promise<void> | void} [onSuccess]
 * @property {(key: string, error: Error) => Promise<void> | void} [onError]
 * @property {Array<import('./utils.js').MiddlewareFn<FetcherRequestInit>} [use]
 * @property {unknown} [cache]
 * */
/** @param {FetcherConfigs} configs  */
function createFetcher(configs) {
  const { baseUrl = '', use = [], onSuccess, onError } = configs ?? {}
  /**
   * @param {string} url
   * @param {FetcherRequestInit & {
   *	queryParam?: Record<string, string | number>
   *	[key: string]: any
   * }} req
   * */
  async function queryFunction(url, req) {
    const { queryParam, ...restRequest } = req
    const fullUrl = getPath(baseUrl + url, req.queryParam)

    try {
      const lastConfigs = await walkMiddlewares(use, restRequest)

      const response = await fetch(fullUrl, {
        method: 'GET',
        ...lastConfigs
      })

      if (!response.ok) {
        throw response
      }
      const data = await response.json()
      if (onSuccess(fullUrl)) return data
    } catch (error) {
      if (onError) onError(fullUrl, error)
      throw error
    }
  }
  /**
   * @param {"POST" | "PUT" | "DELETE"} method
   * */
  async function mutateFunction(method) {
    //
    return function(url, req) {

    }
  }
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
