// apps/web/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@aec-twin/database"],

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
