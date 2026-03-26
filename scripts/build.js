import { build } from "rolldown";

/** @type {string}*/
const input = "src/index.js";

await build({
  input: input,
  output: {
    dir: "dist/esm",
    format: "esm",
    sourcemap: true,
    preserveModules: true,
    preserveModulesRoot: "src",
  },
});

await build({
  input: input,
  output: {
    dir: "dist/cjs",
    format: "cjs",
    sourcemap: true,
    preserveModules: true,
    preserveModulesRoot: "src",
  },
});
