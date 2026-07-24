import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: Number(env.VITE_PORT) || 5173,
      open: true,
      fs: {
        allow: [".."],
      },
      proxy: {
        "/api": {
          target: env.CICWEB_BACKEND_PROXY_TARGET,
          changeOrigin: true,
          xfwd: true,
        },
        "/media": env.CICWEB_BACKEND_PROXY_TARGET,
        "/resources": env.CICWEB_BACKEND_PROXY_TARGET,
        "/videos": env.CICWEB_BACKEND_PROXY_TARGET,
      },
    },
  };
});
