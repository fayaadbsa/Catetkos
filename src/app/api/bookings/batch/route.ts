import { createBatch } from '@/lib/resources';
import { body, route, withKos } from '@/lib/server-api';

export const POST = route(async (req) => createBatch((await withKos()).kos, await body(req)), 201);
