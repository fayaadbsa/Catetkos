import { quoteMonths } from '@/lib/resources';
import { route, withKos } from '@/lib/server-api';

export const GET = route(async (req) => {
  const { kos } = await withKos();
  const q = new URL(req.url).searchParams;
  return quoteMonths(kos, Number(q.get('room_id')), String(q.get('check_in')), q.get('months'));
});
