import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 3000,
    host: true,
    // Allow any ngrok/localtunnel host
    allowedHosts: true,
    headers: {
      // Tells ngrok to skip the browser warning interstitial page
      'ngrok-skip-browser-warning': '1',
    },
    proxy: {
      // Proxy all API calls through Vite dev server — only 1 ngrok tunnel needed
      '/user': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/analyze': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
