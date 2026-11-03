import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Đọc file .env ở thư mục gốc của dự án
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  server: {
    port: 5173,
  },
});
