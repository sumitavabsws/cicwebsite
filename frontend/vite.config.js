import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendTarget = process.env.CIC_BACKEND_PROXY_TARGET ?? "http://10.72.14.39:8000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
        xfwd: true,
      },
      "/media": backendTarget,
      "/resources": backendTarget,
      "/videos": backendTarget,
    },
  },
  preview: {
    host: "0.0.0.0",
  },
})
