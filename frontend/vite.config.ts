import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Local dev/preview resources only; never copied into the deployable build.
const localRoot = fileURLToPath(new URL('../_local/', import.meta.url));

async function serveLocalFiles(req: IncomingMessage, res: ServerResponse) {
        try {
          const relative = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/^\/+/, '');
          const path = resolve(localRoot, relative);
          const allowed = ['.json', '.jpg', '.webp', '.png'];
          if (!path.startsWith(resolve(localRoot) + sep) || !allowed.includes(extname(path))) {
            res.statusCode = 404; res.end(); return;
          }
          const body = await readFile(path);
          res.setHeader('Content-Type', extname(path) === '.json' ? 'application/json; charset=utf-8' : extname(path) === '.jpg' ? 'image/jpeg' : `image/${extname(path).slice(1)}`);
          res.setHeader('Cache-Control', 'no-cache');
          res.end(body);
        } catch {
          res.statusCode = 404; res.end('Local resource not found');
        }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'roma-local-fixtures',
    apply: 'serve',
    configurePreviewServer(server) { server.middlewares.use('/_local', serveLocalFiles); },
    configureServer(server) {
      server.middlewares.use('/_local', serveLocalFiles);
    },
  }],
  // Đọc file .env ở thư mục gốc của dự án
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  server: {
    port: 5173,
  },
});
