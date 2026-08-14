import reactHooks from 'eslint-plugin-react-hooks';

// Основной линтер проекта — oxlint (`npm run lint`). Этот конфиг добавляет то,
// чего у oxlint нет: exhaustive-deps и правила React Compiler
// (set-state-in-effect, purity и т.д.). Запускается отдельно: `npm run lint:hooks`.
export default [
  {
    ignores: ['dist/**', 'node_modules/**', '_backup_*/**', '_to_delete/**'],
  },
  reactHooks.configs.flat.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
];
