
import type { Row } from '@/lib/types';
import { SEM } from '@/lib/theme';
import { Badge } from '@/components/ui';

export const opts = (rows: Row[], l: (r: Row) => string) => rows.map((r) => ({ v: r.id, l: l(r) }));

export const activeBadge = (r: Row) =>
  r.archived ? <Badge>Arsip</Badge> : <Badge color={SEM.ok}>Aktif</Badge>;
