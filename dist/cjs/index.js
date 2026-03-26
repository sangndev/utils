Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_deep_equal = require("./deep-equal.js");
const require_deep_clone = require("./deep-clone.js");
const require_create_store = require("./create-store.js");
exports.createStore = require_create_store.createStore;
exports.deepClone = require_deep_clone.deepClone;
exports.deepEqual = require_deep_equal.deepEqual;
exports.getOriginalObject = require_create_store.getOriginalObject;
exports.subscribe = require_create_store.subscribe;
