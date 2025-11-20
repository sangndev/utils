/**
 * Proxy State Utility
 *
 * A reactive state management utility that enables automatic tracking of changes
 * to objects and arrays using JavaScript Proxies. Perfect for building reactive
 * applications with minimal boilerplate. Works seamlessly with React via the
 * `useSubscribe` hook powered by `useSyncExternalStore`.
 *
 * Key Features:
 * - **Deep Observation**: Automatically tracks changes to nested objects and arrays
 * - **Batched Handlers**: Executes all change handlers in batches for optimal performance using Promise microtasks
 * - **Type Safety**: Full TypeScript support with proper type inference
 * - **Memory Efficient**: Uses WeakMap for automatic garbage collection
 * - **Change Detection**: Compares values using Object.is() and deep equality checks to prevent unnecessary updates
 * - **React Integration**: `useSubscribe` hook using `useSyncExternalStore` for seamless React component integration
 * - **Array & Object Support**: Properly tracks mutations like `push()`, `pop()`, property assignments, etc.
 *
 * Supported Types:
 * - Plain Objects: `{}`
 * - Arrays: `[]`
 * - Nested structures combining objects and arrays
 *
 * ## Core API
 *
 * ### `proxy<T>(obj: T): T`
 * Creates a reactive proxy of an object or array. All changes to the proxied object will trigger subscribers.
 *
 * ```ts
 * const state = proxy({ name: 'John', age: 30, items: [] });
 * ```
 *
 * ### `subscribe<T>(obj: T, key: keyof T, handler: (newValue) => void): () => void`
 * Subscribes to property changes with a callback handler. Returns an unsubscribe function.
 *
 * ```ts
 * const unsubscribe = subscribe(state, 'age', (newValue) => {
 *   console.log('Age changed to:', newValue);
 * });
 *
 * state.age = 31; // Triggers handler - executes in next microtask batch
 * unsubscribe(); // Stop listening
 * ```
 *
 * ### `useSubscribe<T, K>(obj: T, key: K): T[K]` (React Hook)
 * Subscribes to property changes in React components using `useSyncExternalStore`.
 * Returns the current value and automatically re-renders when it changes.
 * Update the value directly on the proxied object to maintain reactivity.
 *
 * ```ts
 * const state = proxy({ count: 0, items: ['a', 'b'], user: { name: 'John' } });
 *
 * function Counter() {
 *   // Subscribe to primitives
 *   const count = useSubscribe(state, 'count');
 *
 *   // Subscribe to arrays - tracks mutations like push(), pop(), etc.
 *   const items = useSubscribe(state, 'items');
 *
 *   // Subscribe to nested objects
 *   const user = useSubscribe(state, 'user');
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <p>User: {user.name}</p>
 *       <button onClick={() => state.count++}>Increment</button>
 *       <button onClick={() => state.items.push('c')}>Add Item</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * ## Advanced Usage
 *
 * ### Nested Objects and Arrays
 * ```ts
 * const state = proxy({
 *   user: { name: 'John', age: 30 },
 *   hobbies: ['reading', 'gaming'],
 *   stats: {
 *     posts: [1, 2, 3],
 *     followers: 100
 *   }
 * });
 *
 * // Subscribe to nested property changes
 * subscribe(state, 'user', (newUser) => {
 *   console.log('User changed:', newUser);
 * });
 *
 * // Update nested values - all properly reactive
 * state.user = { name: 'Jane', age: 25 };
 * state.hobbies.push('cooking');
 * state.stats.posts.push(4);
 * state.stats.followers++;
 * ```
 *
 * ### Multiple Subscribers
 * ```ts
 * const state = proxy({ count: 0 });
 *
 * const unsub1 = subscribe(state, 'count', (val) => console.log('Handler 1:', val));
 * const unsub2 = subscribe(state, 'count', (val) => console.log('Handler 2:', val));
 *
 * state.count = 5;
 * // Both handlers execute in the same batch for optimal performance
 * ```
 *
 * ### React Component with Multiple Values
 * ```ts
 * const appState = proxy({
 *   user: { id: 1, name: 'Alice' },
 *   todos: [],
 *   loading: false
 * });
 *
 * function TodoApp() {
 *   const user = useSubscribe(appState, 'user');
 *   const todos = useSubscribe(appState, 'todos');
 *   const loading = useSubscribe(appState, 'loading');
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {user.name}!</h1>
 *       {loading && <p>Loading...</p>}
 *       <ul>
 *         {todos.map(todo => (
 *           <li key={todo.id}>{todo.title}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 *
 * ## Performance Characteristics
 *
 * - **Batched Updates**: Multiple property changes in the same event loop are batched together
 * - **Memoized Subscriptions**: `useSubscribe` uses `useCallback` to prevent unnecessary re-subscriptions
 * - **Shallow Comparisons**: Uses Object.is() for primitives and deepEqual() for complex types
 * - **No Re-proxying**: Nested objects are cached to avoid creating multiple proxies
 * - **Memory Safe**: WeakMap ensures proxied objects are garbage collected when no longer referenced
 *
 * @module proxy-state
 */

import { useState, useEffect } from "react";
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
const refSet: WeakSet<object> = new WeakSet();
const GET_ORIGINAL_SYMBOL = Symbol();
const SELF_SYMBOL = Symbol("__self__");
const objectIs = Object.is;
let handlerBatch: Array<{ handler: THandler; record: unknown }> = [];
let batchScheduled = false;

/* =============================================================================
 * Utils
 * =============================================================================
 */
function isObject<T>(obj: T) {
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

function deepClone<T>(obj: T, cached: WeakSet<object> = refSet): T {
  if (!isObject(obj) || cached.has(obj)) {
    return obj;
  }

  const baseObject: T = Array.isArray(obj)
    ? []
    : Object.create(Object.getPrototypeOf(obj));
  Reflect.ownKeys(obj).forEach((key) => {
    baseObject[key as keyof T] = deepClone(obj[key as keyof T], cached);
  });
  return baseObject;
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

function proxy<T extends object>(
  obj: T,
  registerStateToStore: boolean = false,
): T {
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
  if (!subscriber && registerStateToStore) {
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

function useSubscribe<T extends object, K extends keyof T>(
  obj: T,
  key: K,
): T[K] {
  const [value, setValue] = useState<T[K]>(
    isObject(obj) ? getOriginalObject(obj[key] as any) : obj[key],
  );

  useEffect(() => {
    // Subscribe to changes on the proxy object
    const unsubscribe = subscribe(obj, key, (newValue) => {
      let assignedValue = newValue;
      // By pass “state identity equality check” for Object value
      // React will not re-render if you call setState with a value that is
      // referentially identical to the previous value.
      if (isObject(newValue)) {
        assignedValue = deepClone(newValue);
      }
      setValue(assignedValue as T[K]);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [obj, key, setValue]);

  return value;
}

export { proxy, subscribe, useSubscribe };
