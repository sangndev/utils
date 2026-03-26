# .agents

Lightweight, repo-local notes intended to reduce re-scanning the codebase in future sessions.

## Repo map

- `src/` library source (ESM)
  - `src/create-store.js` proxy-based reactive store + subscriptions
  - `src/deep-equal.js`, `src/deep-clone.js` helpers
  - `src/index.js` public exports
- `test/` Node test runner tests (`node --test`)
- `dist/` build output (generated)

## Common tasks

- Run tests: `npm test`
- Build: `yarn build`
- Add a new util:
  - implement in `src/<name>.js`
  - export it from `src/index.js` (with `.js` extension)
  - add a test in `test/<name>.test.js`

