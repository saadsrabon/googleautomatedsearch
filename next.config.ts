import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer", "@puppeteer/browsers"],
  webpack: (config, { dev }) => {
    // Avoid stale chunk refs on Windows when long API routes recompile during dev.
    if (dev) config.cache = false;
    return config;
  },
};

export default nextConfig;
