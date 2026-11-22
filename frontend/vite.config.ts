import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const backendUrl = env.BACKEND_URL || "http://localhost:4000";

  return {
    plugins: [react(), tailwindcss()],

    envDir: rootDir,

    server: {
      port: 5173,
      proxy: {
        "/api": { target: backendUrl, changeOrigin: true },
      },
    },

    build: {
      sourcemap: true,
      minify: "esbuild",
      reportCompressedSize: true,
      cssMinify: false,
    },
  };
});
