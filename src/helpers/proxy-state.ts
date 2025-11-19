import { deepEqual } from "./deep-equal";

/* =============================================================================
 * Types
 * =============================================================================
 */
type THandler = (record: unknown) => void;
type TKey = string | number | symbol;
type TNotifyUpdateParams = {
  path: TKey;
  newValue: unknown;
  target: object;
};
type TNotifyUpdateFn = (params: TNotifyUpdateParams) => void;

/* =============================================================================
 * Constants
 * =============================================================================
 */
const subscriberStore: WeakMap<object, Map<TKey, THandler[]>> = new WeakMap();
const GET_ORIGINAL_SYMBOL = Symbol();
const SELF_SYMBOL = Symbol("__self__");
const objectIs = Object.is;
let handlerBatch: Array<{ handler: THandler; record: unknown }> = [];
let batchScheduled = false;

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
    (obj.constructor && !["Object", "Array"].includes(obj.constructor.name))
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

/**
 * Simple batching utility to dispatch all handlers efficiently
 * Accumulates handler calls and executes them together in a microtask
 */
function dispatchAllHandlers(handlers: THandler[], record: unknown): void {
  if (!handlers || handlers.length === 0) return;

  // Add all handlers to the batch queue
  for (const handler of handlers) {
    handlerBatch.push({ handler, record });
  }

  // Schedule batch execution once per microtask cycle
  if (!batchScheduled) {
    batchScheduled = true;
    Promise.resolve().then(() => {
      const batch = handlerBatch;
      handlerBatch = [];
      batchScheduled = false;

      // Execute all handlers in the batch
      for (const { handler, record } of batch) {
        try {
          handler(record);
        } catch (error) {
          console.error("Error executing handler:", error);
        }
      }
    });
  }
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
        return proxy(nextTarget, true);
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
      notifyUpdate({
        path: property,
        newValue,
        target,
      });

      Reflect.set(target, property, newValue, receiver);
      return true;
    },
    deleteProperty(target, property) {
      Reflect.deleteProperty(target, property);
      return true;
    },
  };
}

function proxy<T extends object>(obj: T, saveToStore: boolean = false): T {
  const subscriber = subscriberStore.get(obj);

  // Notify update of listener
  const notifyUpdate: TNotifyUpdateFn = (params) => {
    const { path, newValue, target: originObject } = params;
    const subscriber = subscriberStore.get(originObject);
    if (subscriber) {
      const handlers = subscriber.get(path);
      const selfHandlers = subscriber.get(SELF_SYMBOL);
      if (handlers && handlers.length > 0) {
        // Dispatch all handlers with batching
        dispatchAllHandlers(handlers, newValue);
      }
      if (selfHandlers && selfHandlers.length > 0) {
        // Dispatch all self handlers with batching
        dispatchAllHandlers(selfHandlers, originObject);
      }
    }
  };

  // Create handler for proxied object
  const handlers = createDefaultHandler(obj, notifyUpdate);

  // Register object to subscribers store if it haven't registed yet
  if (!subscriber && saveToStore) {
    subscriberStore.set(obj, new Map());
  }

  return new Proxy(obj, handlers);
}

function subscribe<T extends object>(
  obj: T,
  key: keyof T,
  handler: THandler,
): Function {
  const nextValue = obj[key];
  const originalNextValue = getOriginalObject(nextValue as T);
  const originalObject = getOriginalObject(obj);

  // Determine which symbol/key to use based on whether value is an object
  const subscribeKey = canProxy(originalNextValue) ? SELF_SYMBOL : key;
  const targetObject = canProxy(originalNextValue)
    ? originalNextValue
    : originalObject;

  // Get or create subscriber map
  let subscriber = subscriberStore.get(targetObject);
  if (!subscriber) {
    subscriber = new Map();
    subscriberStore.set(targetObject, subscriber);
  }

  // Add handler to subscriber
  const handlers = subscriber.get(subscribeKey) || [];
  handlers.push(handler);
  subscriber.set(subscribeKey, handlers);

  // Return unsubscribe function
  return () => {
    const subscriber = subscriberStore.get(targetObject);
    if (subscriber) {
      subscriber.set(subscribeKey, []);
    }
  };
}

export { proxy, subscribe };
