import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'next-env.d.ts',
    'src/generated/**',
    'dist/**',
    'research/**',
  ]),
  {
    rules: {
      // ponytail: baris DB dinamis (kolom dari SQL mentah) bertipe Row longgar. Upgrade: tipe per entity.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
