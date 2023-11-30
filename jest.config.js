module.exports = {
  transform: {
    // "^.+\\.tsx?$": ["esbuild-jest", {sourcemap:true}]
    "^.+\\.tsx?$": "es-jest"
  },
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  watchPathIgnorePatterns: ['dist\\/'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageProvider: 'v8',
};
