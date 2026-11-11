import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const localRoot = fileURLToPath(new URL("../_local/", import.meta.url));

async function serveLocalFiles(req: IncomingMessage, res: ServerResponse) {
  try {
    const relative = decodeURIComponent((req.url ?? "").split("?")[0]).replace(
      /^\/+/,
      "",
    );

    const path = resolve(localRoot, relative);

    const allowed = [".json", ".jpg", ".webp", ".png"];

    if (
      !path.startsWith(resolve(localRoot) + sep) ||
      !allowed.includes(extname(path))
    ) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const body = await readFile(path);
    const extension = extname(path);

    const contentTypes: Record<string, string> = {
      ".json": "application/json; charset=utf-8",
      ".jpg": "image/jpeg",
      ".webp": "image/webp",
      ".png": "image/png",
    };

    res.setHeader("Content-Type", contentTypes[extension]);
    res.setHeader("Cache-Control", "no-cache");
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end("Local resource not found");
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "roma-local-fixtures",
      apply: "serve",

      configurePreviewServer(server) {
        server.middlewares.use("/_local", serveLocalFiles);
      },

      configureServer(server) {
        server.middlewares.use("/_local", serveLocalFiles);
      },
    },
  ],

  envDir: fileURLToPath(new URL("..", import.meta.url)),

  server: {
    port: 5173,
  },

  build: {
    sourcemap: false,
    minify: "esbuild",
  },
});
