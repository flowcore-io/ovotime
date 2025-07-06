import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Externalize bun-specific modules that aren't available in Node.js
    config.externals = config.externals || [];
    
    if (isServer) {
      config.externals.push('bun:sqlite');
    }
    
    // Ignore bun-sqlite-key-value in client builds
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'bun:sqlite': false,
    };
    
    return config;
  },
  serverExternalPackages: ['bun-sqlite-key-value'],
};

export default nextConfig;
