# .agents

Lightweight, repo-local notes intended to reduce re-scanning the codebase in future sessions.

## Repo map

- `src/` library source (ESM)
  - `src/create-store.js` proxy-based reactive store + subscriptions
  - `src/deep-equal.js`, `src/deep-clone.js` helpers
  - `src/index.js` public exports
- `test/` Node test runner tests (`node --test`)
- `dist/` build output (generated)

## `createStore` quick usage

Primitive subscription:

```js
import { createStore, subscribe } from './src/create-store.js'

const state = createStore({ count: 0 })
subscribe(state, 'count', (next) => console.log('count ->', next))

state.count = 1
await Promise.resolve() // notifications are batched in a microtask
```

Nested object/array subscription (handler gets the original object/array):

```js
const state = createStore({ user: { name: 'A' }, list: [1, 2] })
subscribe(state, 'user', (user) => console.log(user.name))
subscribe(state, 'list', (list) => console.log(list[0]))

state.user.name = 'B'
state.list[0] = 99
await Promise.resolve()
```

Gotchas:

- Array index keys: proxy traps receive indices as strings; `subscribe(list, 0, ...)` is supported (we normalize number -> string).
- Deletes: `delete obj.key` currently does not notify subscribers.

## Common tasks

- Run tests: `npm test`
- Build: `yarn build`
- Add a new util:
  - implement in `src/<name>.js`
  - export it from `src/index.js` (with `.js` extension)
  - add a test in `test/<name>.test.js`
