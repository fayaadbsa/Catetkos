import { defineConfig, devices } from '@playwright/test';

// Server nyata + DB sementara; tidak menyentuh data prod. Jalankan: bun run build && bun run test:e2e
const DB = '/tmp/catetkos-e2e.db';
export default defineConfig({
  testDir: 'e2e',
  workers: 1,
  webServer: {
    command: `rm -f ${DB}* && DB_PATH=${DB} npx prisma migrate deploy && TEST_PASSWORD=e2e-pass-123 DB_PATH=${DB} npx tsx scripts/seed-test.ts && DB_PATH=${DB} PORT=3199 npx next start -p 3199 -H 127.0.0.1`,
    url: 'http://127.0.0.1:3199/api/status',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:3199',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
  projects: [{ name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'chromium' } }],
});
