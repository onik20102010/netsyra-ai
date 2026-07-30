// scripts/bundle-eslint-worker.mjs
// Bundles ESLint + TypeScript parser into a single browser-compatible Web Worker file.
// Run: node scripts/bundle-eslint-worker.mjs

import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

await build({
  entryPoints: [join(root, "scripts/eslint-worker-entry.js")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  outfile: join(root, "public/lint.worker.js"),
  minify: true,
  sourcemap: false,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  logLevel: "info",
});

console.log("✅ ESLint worker bundled to public/lint.worker.js");
