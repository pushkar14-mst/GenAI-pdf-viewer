import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config: any) => {
    // Handle canvas for PDF.js - these are not available on server
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Mark pdfjs-dist as external for server builds
    if (!config.isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
      };
    }

    return config;
  },
};

export default nextConfig;
