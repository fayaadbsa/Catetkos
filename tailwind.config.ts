// Token warna semantik (CSS variable di index.css). Ganti tema = ganti variabel, bukan komponen.
const t = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: { bg: t('bg'), surface: t('surface'), soft: t('soft'), line: t('line'), tx: t('tx'), mut: t('mut'), primary: t('primary'), 'primary-fg': t('primary-fg'), accent: t('accent'), brand: t('brand'), danger: t('danger'), warn: t('warn'), ok: t('ok') },
      boxShadow: { card: '0 1px 2px 0 rgb(var(--shadow) / .06)' },
    },
  },
  plugins: [],
};
