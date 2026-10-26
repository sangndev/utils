//#region src/create-fetcher/create-fetcher.js
/**
* @typedef {Object} Configs
* @property {string} [baseUrl]
* @property {number} [timeout]
* @property {(key: string, data: any) => Promise<void> | void} [onSuccess]
* @property {(key: string, error: Error | Response) => Promise<void> | void} [onError]
* @property {Array<import('./utils.js').MiddlewareFn<FetcherRequestInit>} [use]
* @property {Map<string, any>} [cache]
* */
/** @param {Configs} configs  */
function createFetcher({}) {
	let { baseUrl, cache, onError, onSuccess, timeout, use } = configs;
	baseUrl = baseUrl ?? "";
	cache = cache ?? /* @__PURE__ */ new Map();
	onError = onError ?? (() => {});
	onSuccess = onSuccess ?? (() => {});
	timeout = timeout ?? 3e4;
	use = use ?? [];
	return {};
}
//#endregion
exports.createFetcher = createFetcher;

//# sourceMappingURL=create-fetcher.js.map