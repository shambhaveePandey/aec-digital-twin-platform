// apps/web/lib/utils/asset-path.ts
//
// Resolve a public asset path so it works both at a domain root (local dev)
// and under a GitHub Pages project subpath (e.g. /aec-digital-twin-platform).
//
// `NEXT_PUBLIC_BASE_PATH` is injected at build time from BASE_PATH in
// next.config.mjs. When empty, paths are returned unchanged.

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Prefix an absolute public path (starting with "/") with the configured
 * base path. Example: assetPath("/wasm") -> "/aec-digital-twin-platform/wasm".
 */
export function assetPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}
