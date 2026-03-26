const require_deep_equal = require("./deep-equal.js");
//#region src/create-store.js
/** @typedef {(record: unknown) => void} Handler*/
/** @typedef {string | number | symbol} Key*/
/** @typedef {(params: {path: Key; newValue: unknown; target: object}) => void} NotifyUpdateFn*/
/** @type {WeakMap<object, Map<Key, Handler[]>>}*/
const subscriberStore = /* @__PURE__ */ new WeakMap();
const GET_ORIGINAL = new Symbol();
const GET_SELF = Symbol("__self__");
const objectIs = Object.is;
/** @type {Array<{handler: Handler; record: unknown}>}*/
let handleBatch = [];
let batchScheduled = false;
/**
* @template T
* @param {T} obj
* @param {boolean} registerStateToStore
* @return void
* */
function createStore(obj, registerStateToStore = false) {
	/** @type {NotifyUpdateFn} */
	const notifyUpdate = (params) => {
		const { path, newValue, target: originObject } = params;
		const subscriber = subscriberStore.get(originObject);
		if (subscriber) {
			const handlers = subscriber.get(path);
			const selfHandlers = subscriber.get(GET_SELF);
			if (handlers && handlers.length > 0) dispatchAllHandlers(handlers, newValue);
			if (selfHandlers && selfHandlers.length > 0) dispatchAllHandlers(selfHandlers, originObject);
		}
	};
	const subscriber = subscriberStore.get(obj);
	const handlers = createDefaultHandler(obj, notifyUpdate);
	if (!subscriber && registerStateToStore) subscriberStore.set(obj, /* @__PURE__ */ new Map());
	return new Proxy(obj, handlers);
}
/**
* @template T
* @param {T} obj
* @param {keyof T} key
* @param {Handler} handler
* @returns {Function}
*/
function subscribe(obj, key, handler) {
	const nextValue = obj[key];
	const nextValueOriginal = getOriginalObject(nextValue);
	const objectOriginal = getOriginalObject(obj);
	const subscribeKey = canProxy(nextValueOriginal) ? GET_SELF : key;
	const target = canProxy(objectOriginal) ? nextValueOriginal : objectOriginal;
	let subscriber = subscriberStore.get(target);
	if (!subscriber) {
		subscriber = /* @__PURE__ */ new Map();
		subscriberStore.set(target, subscriber);
	}
	const handlers = subscriber.get(subscribeKey) ?? [];
	handlers.push(handler);
	subscriber.set(subscribeKey, handlers);
	return () => {
		subscriber.delete(subscribeKey);
	};
}
/**
*  Return the plain object
*
* @template T
* @param {T} obj
* @returns {T}
*/
function getOriginalObject(obj) {
	return obj[GET_ORIGINAL_SYMBOL] || obj;
}
/**
* @param {object} obj
* @returns boolean
*/
function isObject(obj) {
	return typeof obj === "object" && obj !== null;
}
/**
* @param {object} obj
* @returns boolean
*/
function canProxy(obj) {
	if (!isObject(obj) || obj.constructor && !["Object", "Array"].includes(obj.constructor.name)) return false;
	return true;
}
/**
* @param {Handler[]} handlers
* @param {*} record
* @returns void
*/
function dispatchAllHandlers(handlers, record) {
	if (!handlers || handlers.length === 0) return;
	for (const handler of handlers) handleBatch.push({
		handler,
		record
	});
	if (!batchScheduled) {
		batchScheduled = true;
		Promise.resolve().then(() => {
			const batch = handleBatch;
			handleBatch = [];
			batchScheduled = false;
			for (const { handler, record } of batch) try {
				handler(record);
			} catch (error) {
				console.error("Error executing handler:", error);
			}
		});
	}
}
/**
* @param {object} obj
* @param {NotifyUpdateFn} notifyUpdate
* @returns {ProxyHandler}
*/
function createDefaultHandler(obj, notifyUpdate) {
	return {
		get(target, p, receiver) {
			if (p === GET_ORIGINAL) return obj;
			const nextTarget = Reflect.get(target, p, receiver);
			if (canProxy(nextTarget)) return createStore(nextTarget, true);
			return nextTarget;
		},
		set(target, p, newValue, receiver) {
			const prevValue = Reflect.get(target, p, receiver);
			if (objectIs(prevValue, newValue)) return true;
			if (require_deep_equal.deepEqual(prevValue, newValue)) return true;
			notifyUpdate({
				path: p,
				newValue,
				target
			});
			Reflect.set(target, p, newValue, receiver);
			return true;
		},
		deleteProperty(target, p) {
			Reflect.deleteProperty(target, p);
			return true;
		}
	};
}
//#endregion
exports.createStore = createStore;
exports.getOriginalObject = getOriginalObject;
exports.subscribe = subscribe;

//# sourceMappingURL=create-store.js.map