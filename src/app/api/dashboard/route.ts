import { dashboard } from '@/lib/dashboard';
import { route, withKos } from '@/lib/server-api';

export const GET = route(async (req) => {
  const { kos } = await withKos();
  return dashboard(kos, undefined, Object.fromEntries(new URL(req.url).searchParams));
});
