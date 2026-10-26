/** @type {import('tailwindcss').Config} */
const c = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,md,mdx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'),
        surface: c('surface'),
        'surface-2': c('surface-2'),
        inset: c('inset'),
        line: 'rgb(var(--line-rgb) / var(--line-a))',
        'line-strong': 'rgb(var(--line-rgb) / var(--line-strong-a))',
        fg: c('fg'),
        'fg-2': c('fg-2'),
        'fg-3': c('fg-3'),
        accent: c('accent'),
        'accent-ink': c('accent-ink'),
        'accent-soft': 'rgb(var(--accent) / var(--accent-soft-a))',
        warn: c('warn'),
        danger: c('danger'),
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: { container: '1360px' },
      borderRadius: { panel: '28px', card: '20px', device: '26px' },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          to: { opacity: '1', transform: 'none' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'scale-in': 'scale-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
