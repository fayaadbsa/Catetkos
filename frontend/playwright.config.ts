import { defineConfig, devices } from '@playwright/test';

// Server nyata (api Go + build Vite) + DB Postgres sementara; tidak menyentuh data prod.
// Jalankan: npm run build && E2E_DB_URL=... npm run test:e2e   (lihat scripts/e2e-api.sh)
export default defineConfig({
  testDir: 'e2e',
  workers: 1,
  webServer: [
    {
      command: 'bash ../scripts/e2e-api.sh',
      url: 'http://127.0.0.1:8199/api/status',
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: 'API_URL=http://127.0.0.1:8199 npx vite preview --host 127.0.0.1 --port 3199 --strictPort',
      url: 'http://127.0.0.1:3199/',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
  use: {
    baseURL: 'http://127.0.0.1:3199',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
  projects: [{ name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'chromium' } }],
});
