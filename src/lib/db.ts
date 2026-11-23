import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@/generated/prisma/client';

const g = globalThis as unknown as { prisma?: PrismaClient };

function make() {
  const file = resolve(/*turbopackIgnore: true*/ process.env.DB_PATH || 'data/catetkos.db');
  mkdirSync(dirname(file), { recursive: true });
  return new PrismaClient({ adapter: new PrismaLibSql({ url: `file:${file}` }) });
}

export const prisma = g.prisma ?? (g.prisma = make());
