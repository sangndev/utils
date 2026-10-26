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
import { merge } from '../simple-merge.js'

/** @typedef {{parsedData: any; response: Response}} FetcherResponse */
/** @typedef {Omit<RequestInit, 'method'> & {queryParams?: Record<string, string | number>; timeout?:number; json?: Record<string, any>; [key:string]:any}} Request */
/**
 * @typedef {Object} Configs
 * @property {string} [baseUrl]
 * @property {number} [timeout]
 * @property {(key: string, response: FetcherResponse) => Promise<void> | void} [onSuccess]
 * @property {(key: string, error: Error | Response) => Promise<void> | void} [onError]
 * @property {Array<import('./utils.js').MiddlewareFn<Request>} [use]
 * @property {Map<string, any>} [cache]
 * */
/** @param {Configs} configs  */
function createFetcher(configs = {}) {
  let { baseUrl, cache, onError, onSuccess, timeout, use, queryParams } =
    configs
  // Initialize configs
  baseUrl = baseUrl ?? ''
  cache = cache ?? new Map()
  onError = onError ?? (() => {})
  onSuccess = onSuccess ?? (() => {})
  timeout = timeout ?? 30_000 // half a minutes
  use = use ?? []
  queryParams = queryParams ?? {}

  /** @param {"GET" | "POST" | "PUT" | "PATCH" | "DELETE"} method */
  function createMethod(method) {
    let timeoutController
    /** @typedef { string | {key: string; url: string }} Url */
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
        queryParams: _queryParams,
        signal,
        ...restRequest
      } = await walkMiddlewares(use, request ?? {})
      _timeout = _timeout ?? timeout
      body = json ? JSON.stringify(json) : body
      _queryParams = merge(queryParams, _queryParams ?? {})

      const isObject = typeof url === 'object'
      const path = isObject ? url.url : url
      const parsedUrl = getPath(baseUrl + path, _queryParams)
      const key = isObject ? url.key : parsedUrl

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
          ...restRequest
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
    get: createMethod('GET'),
    post: createMethod('POST'),
    put: createMethod('PUT'),
    patch: createMethod('PATCH'),
    delete: createMethod('DELETE')
  }
}

export { createFetcher }
