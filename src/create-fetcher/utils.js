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
