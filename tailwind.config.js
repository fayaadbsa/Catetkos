// Token warna semantik (CSS variable di index.css). Ganti tema = ganti variabel, bukan komponen.
const t = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: { bg: t('bg'), surface: t('surface'), soft: t('soft'), line: t('line'), tx: t('tx'), mut: t('mut'), primary: t('primary'), 'primary-fg': t('primary-fg'), accent: t('accent'), danger: t('danger'), warn: t('warn'), ok: t('ok') },
      boxShadow: { card: '0 6px 18px -8px rgb(var(--shadow) / .25)' },
    },
  },
  plugins: [],
};
