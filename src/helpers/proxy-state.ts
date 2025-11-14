import { deepEqual } from "./deep-equal";

/* =============================================================================
 * Types
 * =============================================================================
 */
type THandler = (record: unknown) => void;
type TKey = string | number | symbol;
type TNotifyUpdateParams = [path: TKey, prevValue: unknown, newValue: unknown, originObject: object];
type TNotifyUpdateFn = (params: TNotifyUpdateParams) => void;

/* =============================================================================
 * Constants
 * =============================================================================
 */
const subscribers: WeakMap<object, Map<TKey, THandler[]>> = new WeakMap();
const objCached: WeakMap<object, boolean> = new WeakMap();
const GET_ORIGINAL_SYMBOL = Symbol();
const objectIs = Object.is;

/* =============================================================================
 * Utils
 * =============================================================================
 */
function isObject(obj: object) {
  return typeof obj === "object" && obj !== null;
}

function canProxy(obj: object): boolean {
  if (
    !isObject(obj) ||
    (obj.constructor && !["Object"].includes(obj.constructor.name))
  ) {
    return false;
  }
  return true;
}

export function getOriginalObject<T extends object>(obj: T): T {
  return (
    (obj as { [GET_ORIGINAL_SYMBOL]?: typeof obj })[GET_ORIGINAL_SYMBOL] || obj
  );
}

/* =============================================================================
 * Core
 * =============================================================================
 * * */

function createDefaultHandler<T extends object>(
  obj: T,
  notifyUpdate: TNotifyUpdateFn,
): ProxyHandler<T> {
  return {
    get(target, prop, receiver) {
      if (prop === GET_ORIGINAL_SYMBOL) {
        return obj;
      }

      const nextTarget = Reflect.get(target, prop, receiver) as object;
      if (canProxy(nextTarget)) {
        return proxy(nextTarget);
      }

      return nextTarget;
    },
    set(target, property, newValue, receiver) {
      const prevValue = Reflect.get(target, property, receiver);

      // Do nothing if new value is equal to previous value
      if (objectIs(prevValue, newValue)) {
        // Primitive value
        return true;
      }

      if (deepEqual(prevValue, newValue)) {
        // Object type value
        return true;
      }

      // Notify subscriber to update new value
      notifyUpdate([property, prevValue, newValue, target]);

      Reflect.set(target, property, newValue, receiver);
      return true;
    },
    deleteProperty(target, prop) {
      return true;
    },
  };
}

function proxy<T extends object>(obj: T): T {
  const subscriber = subscribers.get(obj);
  // Notify update of listener
  const notifyUpdate = () => {};
  // Create handler for proxied object
  const handlers = createDefaultHandler(obj, notifyUpdate);

  // Register object to subscribers store if it haven't registed yet
  if (!subscriber) {
    subscribers.set(obj, new Map());
  }

  return new Proxy(obj, handlers);
}

function subscribe<T extends object>(
  obj: T,
  key: keyof T,
  handler: THandler,
): Function {
  const originalObject = getOriginalObject(obj);
  const subscriber = subscribers.get(originalObject);

  if (!subscriber) {
    // Immediatly return empty if subscriber is undefined
    return () => {};
  }

  // Add handler to subscriber
  const handlers = subscriber.get(key);

  // Case 1: Handlers is empty or undefined
  if (!handlers || handlers.length === 0) {
    subscriber.set(key, [handler]);
  }

  // Case 2: Handlers contain values
  if (handlers && handlers.length > 0) {
    handlers.push(handler);
    subscriber.set(key, handlers);
  }

  // Sync subscriber to store
  subscribers.set(originalObject, subscriber);

  return () => {
    subscriber.set(key, []);
    subscribers.set(originalObject, subscriber);
  };
}

export { proxy, subscribe };
