// apps/web/next.config.mjs
// When deploying to GitHub Pages under a project subpath
// (https://<user>.github.io/<repo>/), set BASE_PATH="/<repo>" in the build env.
// Locally / at a domain root, leave it empty.
const basePath = process.env.BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a fully static site into `out/` so it can be served from GitHub Pages.
  output: "export",

  // Serve under the repo subpath on GitHub Pages.
  basePath,
  assetPrefix: basePath || undefined,

  // next/image optimization needs a server; disable it for static export.
  images: { unoptimized: true },

  // Expose the base path to client code so runtime fetches (manifest, WASM)
  // can be prefixed correctly.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  experimental: {
    serverComponentsExternalPackages: [
      "@thatopen/components",
      "@thatopen/components-front",
      "@thatopen/fragments",
      "three",
      "web-ifc",
    ],
  },

  webpack: (config, { isServer }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }

    return config;
  },

  // NOTE: custom headers() is intentionally omitted. It is unsupported by
  // `output: "export"` and GitHub Pages serves .wasm with the correct
  // application/wasm type by default.
};

export default nextConfig;
