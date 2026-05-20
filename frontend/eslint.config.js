import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importPlugin from 'eslint-plugin-import'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      import: importPlugin,
    },
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
  
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['@', './src'],
            ['@api', './src/api'],
            ['@assets', './src/assets'],
            ['@components', './src/components'],
            ['@data', './src/data'],
            ['@hooks', './src/hooks'],
            ['@layout', './src/layout'],
            ['@lib', './src/lib'],
            ['@menu', './src/menuItems'],
            ['@routes', './src/routes'],
            ['@shared', './src/shared'],
            ['@store', './src/store'],
            ['@styles', './src/styles'],
            ['@views', './src/views'],
          ],
          extensions: ['.js', '.jsx'],
          cwd: process.cwd(),
        },
      },
    },
    

    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'import/no-unresolved': 'error',
    },
  },
])