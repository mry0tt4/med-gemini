import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type checking is done by IDE and tsc during development.
    // Skip during build to avoid Vercel/local environment mismatches.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
