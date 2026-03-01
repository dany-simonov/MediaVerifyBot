/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mv-bg': '#0F0F10',
        'mv-card': '#1A1A1E',
        'mv-accent': '#6C63FF',
        'mv-text': '#F0F0F5',
        'mv-text-secondary': '#8888A0',
        'mv-fake': '#FF4B4B',
        'mv-real': '#00C48C',
        'mv-uncertain': '#FFB800',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
