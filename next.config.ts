import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb"
    }
  },
  outputFileTracingExcludes: {
    "*": [".agents/**/*", ".codex-plugins/**/*", "C:/Users/**/*"]
  }
};

export default nextConfig;
