import { build } from "rolldown";
import { writeFile } from "node:fs/promises";

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

// Root package.json uses `"type": "module"`, so we need to mark CJS artifacts explicitly.
await writeFile("dist/cjs/package.json", "{\n  \"type\": \"commonjs\"\n}\n");
