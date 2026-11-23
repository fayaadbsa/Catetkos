import { create, HttpError, isResource, list } from '@/lib/resources';
import { body, route, withKos } from '@/lib/server-api';

const known = (r: string) => {
  if (!isResource(r)) throw new HttpError(404, 'Not found');
  return r;
};
type P = { resource: string };

export const GET = route<P>(async (req, p) => {
  const { kos } = await withKos();
  return list(kos, known(p.resource), Object.fromEntries(new URL(req.url).searchParams));
});

export const POST = route<P>(async (req, p) => {
  const { kos } = await withKos();
  return create(kos, known(p.resource), await body(req));
}, 201);
