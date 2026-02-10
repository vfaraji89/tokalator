/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2022',
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        resolveJsonModule: true,
      },
    }],
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Mock the vscode module since it's only available inside VS Code
  moduleNameMapper: {
    '^vscode$': '<rootDir>/__tests__/__mocks__/vscode.ts',
  },
};
