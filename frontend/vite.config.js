import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        xfwd: true,
      },
      "/media": "http://127.0.0.1:8000",
      "/resources": "http://127.0.0.1:8000",
    },
  },
  preview: {
    host: "0.0.0.0",
  },
})
