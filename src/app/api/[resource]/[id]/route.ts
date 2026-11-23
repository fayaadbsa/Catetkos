import { HttpError, isResource, remove, update } from '@/lib/resources';
import { body, idParam, route, withKos } from '@/lib/server-api';

const known = (r: string) => {
  if (!isResource(r)) throw new HttpError(404, 'Not found');
  return r;
};
type P = { resource: string; id: string };

export const PUT = route<P>(async (req, p) => {
  const { kos } = await withKos();
  return update(kos, known(p.resource), idParam(p.id), await body(req));
});

export const DELETE = route<P>(async (_r, p) => {
  const { kos } = await withKos();
  return remove(kos, known(p.resource), idParam(p.id));
});
