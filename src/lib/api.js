export async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || res.statusText), { status: res.status });
  return data;
}
export const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
export const cn = (...c) => c.filter(Boolean).join(' ');
export const toast = (msg, bad = false) => window.dispatchEvent(new CustomEvent('toast', { detail: { msg, bad } }));
export const today = () => new Date().toISOString().slice(0, 10);
