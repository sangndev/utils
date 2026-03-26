//#region src/deep-clone.js
/**
* @template T
* @param {T} value
* @param {WeakMap<object, any>} [cache]
* @returns {T}
*/
function deepClone(value, cache = /* @__PURE__ */ new WeakMap()) {
	const valueType = Object.prototype.toString.call(value);
	if (value === null || typeof value !== "object") return value;
	if (cache.has(value)) return cache.get(value);
	if (value instanceof Date) return new Date(value.getTime());
	if (value instanceof RegExp) return new RegExp(value.source, value.flags);
	if (value instanceof AbortSignal) return value;
	if (value instanceof FormData) return value;
	if (value instanceof Map) {
		const clonedMap = /* @__PURE__ */ new Map();
		cache.set(value, clonedMap);
		value.forEach((val, key) => {
			clonedMap.set(deepClone(key, cache), deepClone(val, cache));
		});
		return clonedMap;
	}
	if (value instanceof Set) {
		const clonedSet = /* @__PURE__ */ new Set();
		cache.set(value, clonedSet);
		value.forEach((item) => {
			clonedSet.add(deepClone(item, cache));
		});
		return clonedSet;
	}
	if (value instanceof ArrayBuffer) return value.slice(0);
	if (ArrayBuffer.isView(value)) {
		if (!(value.buffer instanceof ArrayBuffer)) throw new Error(`Unsupported type: ${valueType}`);
		const clonedBuffer = new value.constructor(value.buffer.slice(0));
		cache.set(value, clonedBuffer);
		return clonedBuffer;
	}
	if (Array.isArray(value)) {
		const clonedArray = [];
		cache.set(value, clonedArray);
		for (const item of value) clonedArray.push(deepClone(item, cache));
		return clonedArray;
	}
	if (Object.prototype.toString.call(value) === "[object Object]") {
		const clonedObj = {};
		cache.set(value, clonedObj);
		for (const key in value) if (Object.prototype.hasOwnProperty.call(value, key)) clonedObj[key] = deepClone(value[key], cache);
		return clonedObj;
	}
	throw new Error(`Unsupported type: ${valueType}`);
}
//#endregion
exports.deepClone = deepClone;

//# sourceMappingURL=deep-clone.js.map