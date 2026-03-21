import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build outputs
    "tokalator-extension-vs/dist/**",
  ]),
  {
    // Extension test mocks and VS Code API interop legitimately require `any`
    files: [
      "tokalator-extension-vs/__tests__/**",
      "tokalator-extension-vs/src/**",
      "app/extension/**",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
