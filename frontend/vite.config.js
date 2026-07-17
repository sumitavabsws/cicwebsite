import fs from "fs";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function getBackendTarget(configuredTarget) {
  if (configuredTarget) {
    return configuredTarget;
  }

  try {
    const configPath = path.resolve(process.cwd(), "public", "config.js");
    const configContent = fs.readFileSync(configPath, "utf8");
    const match = configContent.match(/BACKEND_URL:\s*["']([^"']+)["']/);

    if (match?.[1]) {
      return match[1];
    }
  } catch {
    // The checked-in runtime configuration is optional during local development.
  }

  return "http://127.0.0.1:5500";
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const backendTarget = getBackendTarget(env.CIC_BACKEND_PROXY_TARGET);
  const host = env.CIC_VITE_HOST ?? "127.0.0.1";

  return {
    plugins: [react()],
    server: {
      host,
      port: Number(env.VITE_PORT) || 5173,
      open: true,
      fs: {
        allow: [".."],
      },
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
    preview: { host },
  };
});
