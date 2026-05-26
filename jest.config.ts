import type { Config } from 'jest';

// Multi-project Jest scaffold. PR-0 only ships unit tests; the `integration`
// and `components` projects are placeholder targets that stay green until
// those suites land in later PRs.
const config: Config = {
  passWithNoTests: true,
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
    {
      preset: 'ts-jest',
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      preset: 'ts-jest',
      displayName: 'components',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/components/**/*.test.ts?(x)'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};

export default config;
