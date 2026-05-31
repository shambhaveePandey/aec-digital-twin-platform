import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@aec-twin/database"],

  // Three.js and ThatOpen run only in the browser; exclude from SSR bundles
  serverExternalPackages: [
    "@thatopen/components",
    "@thatopen/components-front",
    "@thatopen/fragments",
    "three",
    "web-ifc",
  ],

  webpack: (config, { isServer }) => {
    // Enable async WebAssembly for web-ifc
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // Suppress "Can't resolve 'canvas'" warning from Three.js on server
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }

    return config;
  },

  async headers() {
    return [
      {
        source: "/wasm/:path*",
        headers: [{ key: "Content-Type", value: "application/wasm" }],
      },
    ];
  },
};

export default nextConfig;
