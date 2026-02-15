import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend URL for dev-server proxy. In Docker set API_PROXY_TARGET=http://backend:8000
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
