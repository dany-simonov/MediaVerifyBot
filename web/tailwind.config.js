/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'mv-bg': '#0A0A0B',
        'mv-surface': '#111113',
        'mv-surface-2': '#1A1A1E',
        'mv-border': '#2A2A30',
        'mv-accent': '#0D9488',
        'mv-accent-hover': '#0F766E',
        'mv-text': '#F1F5F9',
        'mv-text-secondary': '#94A3B8',
        'mv-text-muted': '#475569',
        'mv-fake': '#EF4444',
        'mv-real': '#10B981',
        'mv-uncertain': '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
};
