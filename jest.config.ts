import type { Config } from "jest";

const baseConfig: Config = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

const config: Config = {
  projects: [
    {
      ...baseConfig,
      displayName: "unit",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/__tests__/unit/**/*.test.ts"],
    },
    {
      ...baseConfig,
      displayName: "integration",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/__tests__/integration/**/*.test.ts"],
    },
    {
      ...baseConfig,
      displayName: "components",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/src/__tests__/components/**/*.test.tsx"],
      setupFilesAfterEnv: ["@testing-library/jest-dom"],
    },
  ],
};

export default config;
