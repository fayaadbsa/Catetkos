import { defineConfig, devices } from '@playwright/test';

// Server nyata + DB sementara; tidak menyentuh data prod. Jalankan: npm run build && npm run test:e2e
export default defineConfig({
  testDir: 'e2e',
  workers: 1,
  webServer: {
    command: 'rm -f /tmp/catetkos-e2e.db* && TEST_PASSWORD=e2e-pass-123 DB_PATH=/tmp/catetkos-e2e.db node scripts/seed-test.js && DB_PATH=/tmp/catetkos-e2e.db PORT=3199 node server/index.js',
    url: 'http://127.0.0.1:3199/api/status',
    reuseExistingServer: false,
  },
  use: { baseURL: 'http://127.0.0.1:3199' },
  projects: [{ name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'chromium' } }],
});
