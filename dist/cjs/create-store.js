const require_deep_equal = require("./deep-equal.js");
//#region src/create-store.js
/** @typedef {(record: unknown) => void} Handler*/
/** @typedef {string | number | symbol} Key*/
/** @typedef {(params: {path: Key; newValue: unknown; target: object}) => void} NotifyUpdateFn*/
/**
* Reactive store built on top of `Proxy`.
*
* ## Usage
*
* Subscribe to a primitive field:
*
* @example
* const state = createStore({ count: 0 })
* const unsubscribe = subscribe(state, 'count', (next) => {
*   console.log('count ->', next)
* })
*
* state.count = 1
* await Promise.resolve() // handlers run batched in a microtask
* unsubscribe()
*
* Subscribe to a nested object/array (handler receives the original object/array):
*
* @example
* const state = createStore({ user: { name: 'A' }, list: [1, 2] })
*
* subscribe(state, 'user', (user) => console.log(user.name))
* subscribe(state, 'list', (list) => console.log(list[0]))
*
* state.user.name = 'B' // triggers the 'user' subscription
* state.list[0] = 99    // triggers the 'list' subscription
* await Promise.resolve()
*
* - `createStore(obj)` wraps a plain object/array and returns a proxy that can
*   track nested objects lazily (nested values are proxied on access).
* - `subscribe(store, key, handler)` subscribes to changes:
*   - If `store[key]` is a primitive, `handler(newValue)` is called when that
*     property changes.
*   - If `store[key]` is a plain object/array, `handler(targetObject)` is
*     called when *any* nested property on that object changes.
* - Notifications are batched per microtask to avoid redundant handler calls
*   when multiple writes happen synchronously.
*
* Notes:
* - Only plain objects and arrays are proxied (class instances are ignored).
* - Deletes currently do not trigger notifications.
*/
/** @type {WeakMap<object, Map<Key, Handler[]>>}*/
const subscriberStore = /* @__PURE__ */ new WeakMap();
const refSet = /* @__PURE__ */ new WeakSet();
const GET_ORIGINAL = Symbol("GET_ORIGINAL");
const GET_SELF = Symbol("__self__");
const objectIs = Object.is;
/** @type {Array<{handler: Handler; record: unknown}>}*/
let handleBatch = [];
let batchScheduled = false;
/**
* Wrap a plain object/array in a proxy-backed store.
*
* Nested objects/arrays are proxied lazily when accessed.
*
* @example
* const state = createStore({ a: 1, nested: { b: 2 } })
* state.a = 2
* state.nested.b = 3
*
* @template T
* @param {T} obj
* @param {boolean} registerStateToStore
* @returns {T}
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
* Subscribe to changes on `obj[key]`.
*
* Behavior depends on the current value at `key`:
* - Primitive (or non-proxyable object): calls `handler(newValue)` when
*   `obj[key]` changes.
* - Plain object/array: calls `handler(targetObject)` when any nested field in
*   that object/array changes (handler receives the original object/array).
*
* Handlers are executed in a microtask batch (multiple synchronous writes
* result in a single queued batch).
*
* @example
* const state = createStore({ count: 0, nested: { value: 0 } })
* const unsubCount = subscribe(state, 'count', (count) => console.log(count))
* const unsubNested = subscribe(state, 'nested', (nested) => console.log(nested.value))
*
* state.count = 1
* state.nested.value = 2
* await Promise.resolve()
*
* unsubCount()
* unsubNested()
*
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
	const normalizedKey = typeof key === "number" ? String(key) : key;
	const subscribeKey = canProxy(nextValueOriginal) ? GET_SELF : normalizedKey;
	const target = canProxy(nextValueOriginal) ? nextValueOriginal : objectOriginal;
	let subscriber = subscriberStore.get(target);
	if (!subscriber) {
		subscriber = /* @__PURE__ */ new Map();
		subscriberStore.set(target, subscriber);
	}
	const handlers = subscriber.get(subscribeKey) ?? [];
	handlers.push(handler);
	subscriber.set(subscribeKey, handlers);
	return () => {
		const list = subscriber.get(subscribeKey);
		if (!list) return;
		const index = list.indexOf(handler);
		if (index !== -1) list.splice(index, 1);
		if (list.length === 0) subscriber.delete(subscribeKey);
	};
}
/**
* Return the original (non-proxy) object/array behind a store value.
*
* @example
* const state = createStore({ nested: { a: 1 } })
* const nestedProxy = state.nested
* const nestedOriginal = getOriginalObject(nestedProxy)
*
* @template T
* @param {T} obj
* @returns {T}
*/
function getOriginalObject(obj) {
	if (!isObject(obj)) return obj;
	return obj[GET_ORIGINAL] ?? obj;
}
/**
* Clone a store value (object/array) while avoiding re-visiting references.
* Non-objects and already-seen objects are returned as-is.
*
* @param {object} obj
* @param {WeakSet<object>} [cached]
* @returns
*/
function cloneValueStore(obj, cached = refSet) {
	if (!isObject(obj) || cached.has(obj)) return obj;
	const baseObject = Array.isArray(obj) ? [] : Object.create(Object.getPrototypeOf(obj));
	Reflect.ownKeys(obj).forEach((key) => {
		baseObject[key] = cloneValueStore(obj[key], cached);
	});
	return baseObject;
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
exports.cloneValueStore = cloneValueStore;
exports.createStore = createStore;
exports.getOriginalObject = getOriginalObject;
exports.subscribe = subscribe;

//# sourceMappingURL=create-store.js.map