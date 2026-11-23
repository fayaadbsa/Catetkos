import { payBooking } from '@/lib/resources';
import { body, idParam, route, withKos } from '@/lib/server-api';

export const POST = route<{ id: string }>(async (req, { id }) =>
  payBooking((await withKos()).kos, idParam(id), await body(req)),
);
