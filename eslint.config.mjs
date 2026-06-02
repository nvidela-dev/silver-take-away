import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  configs as airbnb,
  plugins as airbnbPlugins,
} from 'eslint-config-airbnb-extended';
import { defineConfig, globalIgnores } from 'eslint/config';

const rootDir = dirname(fileURLToPath(import.meta.url));

const eslintConfig = defineConfig([
  // Plugins must be registered before the rule sets reference them.
  ...Object.values(airbnbPlugins),

  // Airbnb's full ruleset (JS + TS), with the React and Next.js layers.
  // React rules only fire on .tsx/.jsx files, so this is safe before any UI lands.
  ...airbnb.base.all,
  ...airbnb.react.all,
  ...airbnb.next.all,
  ...airbnb.node.recommended,

  {
    languageOptions: {
      parserOptions: {
        // airbnb-extended already enables `projectService`; we just point it
        // at the right tsconfig root.
        tsconfigRootDir: rootDir,
      },
    },
    settings: {
      'jsx-a11y': {
        components: {
          Input: 'input',
          Select: 'select',
          Textarea: 'textarea',
        },
      },
    },
    rules: {
      // The codebase uses double quotes consistently; flip Airbnb's default.
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      // Named exports are the project convention; default exports are reserved
      // for Next.js file conventions (page.tsx, layout.tsx, route.ts).
      'import-x/prefer-default-export': 'off',
      // We model error subclasses with a `code` field, so multiple per file is fine.
      'max-classes-per-file': 'off',
      // Drizzle relations rely on `() => bills` forward references.
      '@typescript-eslint/no-use-before-define': [
        'error',
        { functions: false, classes: true, variables: true },
      ],
      // Require runtime narrowing or typed APIs instead of compiler trust casts.
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      // Tests use `void identifier` to silence unused-binding warnings while
      // still exercising a destructure pattern.
      'no-void': ['error', { allowAsStatement: true }],
      // `defaultProps` on function components is deprecated in React 18.3+.
      // Allow ES default-argument destructuring instead.
      'react/require-default-props': [
        'error',
        { functions: 'defaultArguments', forbidDefaultForRequired: true },
      ],
    },
  },

  // Top-level config files import devDependencies (drizzle-kit, jest, etc.).
  // That's the convention — they're not shipped to the runtime.
  {
    files: [
      '*.config.{ts,js,mjs,cjs}',
      'drizzle.config.ts',
      'jest.config.ts',
      'next.config.ts',
      'eslint.config.mjs',
    ],
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
    },
  },

  // Tests can import from devDeps, use Jest globals, and lean on iteration
  // patterns that Airbnb otherwise discourages.
  {
    files: ['src/__tests__/**/*.{ts,tsx}'],
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-underscore-dangle': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/db/migrations/**',
  ]),
]);

export default eslintConfig;
