// Token warna semantik (CSS variable di index.css). Ganti tema = ganti variabel, bukan komponen.
const t = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: t('bg'),
        surface: t('surface'),
        soft: t('soft'),
        line: t('line'),
        tx: t('tx'),
        mut: t('mut'),
        primary: t('primary'),
        'primary-fg': t('primary-fg'),
        accent: t('accent'),
        brand: t('brand'),
        danger: t('danger'),
        warn: t('warn'),
        ok: t('ok'),
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(var(--shadow) / .05), 0 1px 3px 0 rgb(var(--shadow) / .03)',
        'card-hover': '0 4px 12px -2px rgb(var(--shadow) / .08)',
        floating: '0 12px 32px -4px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};
