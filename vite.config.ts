import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_PROXY_TARGET || "http://127.0.0.1:8000";
  const devPort = Number(env.VITE_DEV_PORT) || 8080;
  /** When VITE_API_URL is empty, the SPA calls same-origin /api, /login — proxy to Laravel. */
  const useProxy = !env.VITE_API_URL || String(env.VITE_API_URL).trim() === "";

  return {
    server: {
      host: "::",
      port: devPort,
      proxy: useProxy
        ? {
            "/api": { target: proxyTarget, changeOrigin: true },
            "/login": { target: proxyTarget, changeOrigin: true },
            "/register": { target: proxyTarget, changeOrigin: true },
            "/sanctum": { target: proxyTarget, changeOrigin: true },
          }
        : undefined,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
