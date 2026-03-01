/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['**/src/tests/*.e2e.spec.ts'],
  testTimeout: 120000,
  setupFiles: ['./setup-env.js'],
};
