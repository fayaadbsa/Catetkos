export class ApiError extends Error { constructor(msg: string, public status: number) { super(msg); } }
export interface ToastDetail { msg: string; bad: boolean }

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch('/api' + path, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/login') window.dispatchEvent(new Event('unauthorized')); // sesi habis: balik ke login
    throw new ApiError(data.error || res.statusText, res.status);
  }
  return data;
}
export const rp = (n: number | null | undefined) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export const toast = (msg: string, bad = false) => window.dispatchEvent(new CustomEvent<ToastDetail>('toast', { detail: { msg, bad } }));
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Terjadi kesalahan');
export const today = () => new Date().toISOString().slice(0, 10);
