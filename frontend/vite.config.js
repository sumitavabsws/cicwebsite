import { loadEnv, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const getBackendTarget = () => {
  // 1. Highest priority: Environment variable
  if (process.env.CIC_BACKEND_PROXY_TARGET) {
    return process.env.CIC_BACKEND_PROXY_TARGET;
  }
  // 2. Read from public/config.js
  try {
    const configPath = path.resolve(process.cwd(), 'public', 'config.js');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const match = configContent.match(/BACKEND_URL:\s*["']([^"']+)["']/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (error) {
    console.warn("Could not parse BACKEND_URL from config.js, using fallback.");
  }
};

const backendTarget = getBackendTarget();

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT) || 5173,
      open: true,
      proxy: {
        "/media": backendTarget,
        "/resources": backendTarget,
        "/videos": backendTarget,
      },
    },
  }
})
