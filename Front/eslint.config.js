import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

/** Features de CLAUDE.md. Feature nova entra aqui para herdar a regra de fronteira. */
const FEATURES = ['catalogo', 'autenticacao', 'carrinho', 'checkout', 'admin'];

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'public/mockServiceWorker.js'] },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // RNF-MAN-01: sem `any` e sem assercao para contornar o compilador.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],

      // Todo acesso HTTP passa por @/lib/http.
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use o cliente de @/lib/http.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message: 'Use o cliente encapsulado de @/lib/http.',
            },
          ],
          patterns: [
            {
              group: ['@/features/*/*'],
              message:
                'Uma feature nunca importa de outra. O que for compartilhado sobe para components/, lib/ ou hooks/.',
            },
          ],
        },
      ],
    },
  },
  // RNF-MAN-06: uma feature nunca importa de outra. A regra precisa nomear as
  // outras, nao restringir `@/features/*` inteiro — senao a feature tambem
  // ficaria proibida de compor os proprios modulos.
  ...FEATURES.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'axios', message: 'Use o cliente encapsulado de @/lib/http.' }],
          patterns: [
            {
              group: FEATURES.filter((outra) => outra !== feature).map(
                (outra) => `@/features/${outra}/**`,
              ),
              message:
                'Uma feature nunca importa de outra. O que for compartilhado sobe para components/, lib/ ou hooks/.',
            },
          ],
        },
      ],
    },
  })),

  // O proprio cliente HTTP e o unico modulo autorizado a importar axios.
  {
    files: ['src/lib/http.ts', 'src/lib/erros.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  // Handlers de mock e testes usam APIs de rede diretamente por natureza.
  {
    files: ['src/mocks/**/*.ts', 'src/test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-imports': 'off',
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  {
    files: ['*.config.{ts,js}', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
    extends: [tseslint.configs.disableTypeChecked],
  },
);
