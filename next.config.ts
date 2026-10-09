import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  outputFileTracingIncludes: {
    '/*': ['./copilot-contribution/**/*', './catalog-config.json'],
  },
  outputFileTracingExcludes: {
    '/*': ['.git/**', '.claude/**', '.entire/**', 'paper/**', 'user-content/**', 'tokalator-extension-vs/**', 'tokalator-mcp/**'],
  },
  logging: {
    browserToTerminal: "error",
  },
};

export default nextConfig;
