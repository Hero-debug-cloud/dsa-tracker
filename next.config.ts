import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // serverActions are enabled by default in Next.js 14+
    // Remove this configuration as it's causing build issues
  },
};

export default nextConfig;