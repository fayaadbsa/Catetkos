import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist/**'] },
  ...tseslint.configs.recommended,
  hooks.configs["flat/recommended"],
  // ponytail: baris DB dinamis bertipe Row longgar. Upgrade: tipe per entity.
  { rules: { '@typescript-eslint/no-explicit-any': 'off' } },
);
