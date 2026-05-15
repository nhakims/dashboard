import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.*"],
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
