import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// Dev: /api di-proxy ke backend Go (:8080). Prod: reverse proxy (nginx) yang membagi / dan /api.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 3005, proxy: { '/api': 'http://127.0.0.1:8080' } },
  preview: { proxy: { '/api': process.env.API_URL || 'http://127.0.0.1:8080' } },
});
