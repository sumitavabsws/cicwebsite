import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const backendTarget = env.CIC_BACKEND_PROXY_TARGET ?? "http://127.0.0.1:5500";
  const host = env.CIC_VITE_HOST ?? "127.0.0.1";

  return {
    plugins: [react()],
    server: {
      host,
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
