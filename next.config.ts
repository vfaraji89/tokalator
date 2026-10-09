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
  async redirects() {
    return [
      { source: '/pro', destination: '/extension', permanent: true },
      { source: '/calculator', destination: '/tools/calculator', permanent: true },
      { source: '/context', destination: '/tools/context', permanent: true },
      { source: '/tools/analysis', destination: '/tools/economics', permanent: true },
    ];
  },
};

export default nextConfig;
