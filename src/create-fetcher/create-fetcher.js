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

/** @typedef {{parsedData: any; response: Response}} FetcherResponse */
/**
 * @typedef {Object} Configs
 * @property {string} [baseUrl]
 * @property {number} [timeout]
 * @property {(key: string, response: FetcherResponse) => Promise<void> | void} [onSuccess]
 * @property {(key: string, error: Error | Response) => Promise<void> | void} [onError]
 * @property {Array<import('./utils.js').MiddlewareFn<FetcherRequestInit>} [use]
 * @property {Map<string, any>} [cache]
 * */
/** @param {Configs} configs  */
function createFetcher(configs) {
  let { baseUrl, cache, onError, onSuccess, timeout, use } = configs
  // 1. Initialize configs
  baseUrl = baseUrl ?? ''
  cache = cache ?? new Map()
  onError = onError ?? (() => {})
  onSuccess = onSuccess ?? (() => {})
  timeout = timeout ?? 30_000 // half a minutes
  use = use ?? []

  /** @param {"GET" | "POST" | "PUT" | "PATCH" | "DELETE"} method */
  function createMethod(method) {
    let timeoutController
    /** @typedef { string | {key: string; url: string }} Url */
    /** @typedef {Omit<RequestInit, 'method'> & {queryParams?: Record<string, string | number>; timeout?:number; json?: Record<string, any>; [key:string]:any}} Request */
    /**
     * @param {Url} url
     * @param {Request} request
     * @return {Promise<FetcherResponse>}
     * */
    return async function (url, request) {
      let {
        timeout: _timeout,
        json,
        body,
        queryParams,
        signal,
        ...restRequest
      } = request ?? {}
      _timeout = _timeout ?? timeout
      body = json ? JSON.stringify(json) : body
      queryParams = queryParams ?? {}

      const isObject = typeof url === 'object'
      const path = isObject ? url.url : url
      const parsedUrl = getPath(baseUrl + path, queryParams)
      const key = isObject ? url.key : parsedUrl

      const lastRequest = await walkMiddlewares(use, restRequest)

      const timeoutSignal = AbortSignal.timeout(_timeout)
      const combinedSignal = [timeoutSignal]
      if (signal) {
        combinedSignal.push(signal)
      }

      try {
        const response = await fetch(parsedUrl, {
          method: method,
          signal: AbortSignal.any(combinedSignal),
          body: body,
          ...lastRequest
        })
        if (!response.ok) {
          throw response
        }
        const data = await response.json()
        const result = {
          parsedData: data,
          response
        }
        onSuccess(key, result)

        if (method === 'GET') {
          //TODO: cache data into store (implement later)
        }

        return result
      } catch (error) {
        onError(key, error)
        return {
          parsedData: null,
          response: null
        }
      }
    }
  }
  return {
    get: createMethod('GET')
  }
}

export { createFetcher }
