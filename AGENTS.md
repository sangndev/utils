# Agent notes (repo-local)

This repo is ESM (`"type": "module"` in `package.json`).

## Quick commands

- Tests: `npm test` (Node's built-in test runner)
- Build: `yarn build`
- Types: `yarn generate-types`

## Conventions / gotchas

- Use explicit `.js` extensions for local ESM imports/exports under `src/`.
- Tests live in `test/` (Node 22+).
- When documenting a utility, include a short **Usage** section with at least one runnable example (and mention batching/async behavior if relevant).

## Extra docs

See `.agents/README.md` for a repo map + small runbooks.
