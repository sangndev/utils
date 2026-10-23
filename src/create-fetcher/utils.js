/**
 * @param {Storage | Map<string, any>} storage
 * @param {{ttl?: number}} options
 * @returns {{set: (key:string, value: any) => void, get: (key: string) => void, has: (key: string) => boolean }}
 * */
function buildStorage(storage, options) {
  // Local storage
  if (storage instanceof Storage) {
    return {
      get() {},
      set() {},
      has() {}
    }
  }

  // Normal map storage
  return {
    get: storage.get,
    set: storage.set,
    has: storage.has
  }
}

/**
 * @template Ctx
 * @typedef {(context: Ctx) => Promise<Ctx> | Ctx} MiddlewareFn
 * */

/**
 * @template T
 * @param {MiddlewareFn[]} middlewares
 * @param {T} ctx
 * @returns {Promise<T>}
 * */
async function walkMiddlewares(middlewares, ctx) {
  return middlewares.reduce(async (acc, curr) => {
    const lastCtx = await curr(acc)
    if (typeof lastCtx === 'undefined')
      throw new Error('Some middlewares not return the config')
    return lastCtx
  }, ctx)
}

/**
 * @param {string} url
 * @param {Record<string, string>} queryParams
 * */
function getPath(url, queryParams) {
  const queryParamKeys = Object.keys(queryParams ?? {})
  if (queryParamKeys.length === 0) return url

  const _url = new URL(url)
  const origin = _url.origin
  const searchParams = _url.searchParams

  queryParamKeys.forEach((key) => {
    searchParams.set(key, queryParams[key])
  })
  return origin + '?' + searchParams.toString()
}

export { walkMiddlewares, getPath }
