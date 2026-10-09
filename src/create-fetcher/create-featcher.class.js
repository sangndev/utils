class CreateFetcher {
  /** @type {Map<string, any>} */
  #cached = new Map()
  /** @type {CreateFetcher | null} */
  #instance = null
  /** @type {FetcherConfig} */
  #configs

  /** @param {FetcherConfig} props */
  create(props) {
    this.#configs = props
  }
}
/**
 * @typedef {Object} FetcherConfig
 * @property {string} baseUrl
 * */
