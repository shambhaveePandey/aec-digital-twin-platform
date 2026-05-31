/**
 * Copies web-ifc WASM binaries and the fragments worker to public/wasm/
 * so they are served as static assets at /wasm/*.
 * Run: pnpm copy:wasm (called automatically before build in CI).
 */
import { copyFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dest = resolve(root, "public", "wasm");

await mkdir(dest, { recursive: true });

const files = [
  // web-ifc WASM binaries
  [resolve(root, "node_modules/web-ifc/web-ifc.wasm"), "web-ifc.wasm"],
  [resolve(root, "node_modules/web-ifc/web-ifc-mt.wasm"), "web-ifc-mt.wasm"],
  // fragments worker (may not exist in all versions)
  [
    resolve(root, "node_modules/@thatopen/fragments/dist/fragments-worker.mjs"),
    "fragments-worker.mjs",
  ],
];

for (const [src, name] of files) {
  if (existsSync(src)) {
    await copyFile(src, resolve(dest, name));
    console.log(`copied ${name}`);
  } else {
    console.warn(`skipped (not found): ${name}`);
  }
}
