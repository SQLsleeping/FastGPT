module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-unused-vars': 'off', // 关闭，避免TypeScript文件报错
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'dist/',
    'build/',
    '.next/',
    'out/',
    'node_modules/',
    '*.config.js',
    '*.min.js',
    'coverage/',
    'bin/',
    'scripts/',
    'deploy/',
    'docSite/',
    'local/',
    'projects/user-management-service/start-simple.js',
  ],
  overrides: [
    {
      files: ['*.tsx', '*.jsx'],
      extends: ['next/core-web-vitals'],
    },
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      rules: {
        'no-unused-vars': 'off',
        'no-undef': 'off', // TypeScript处理这个
      },
    },
  ],
};
