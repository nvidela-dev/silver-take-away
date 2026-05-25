import type { Config } from 'jest';

// Multi-project Jest scaffold. PR-0 only ships unit tests; the `integration`
// and `components` projects come back in their respective PRs along with the
// libraries they need (test DB harness, jest-environment-jsdom + RTL).
const config: Config = {
  projects: [
    {
      preset: 'ts-jest',
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/unit/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};

export default config;
