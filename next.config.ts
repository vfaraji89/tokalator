import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  logging: {
    browserToTerminal: "error",
  },
};

export default nextConfig;
