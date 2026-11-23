import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

const file = resolve(process.env.DB_PATH || 'data/catetkos.db');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx scripts/seed.ts' },
  datasource: { url: `file:${file}` },
});
