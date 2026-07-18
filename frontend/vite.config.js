import fs from "fs";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const backendTarget = env.VITE_CICWEB_BACKEND_URL;
  const host = '0.0.0.0';

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
