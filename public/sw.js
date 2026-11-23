// Service worker minimal. /api dan halaman (HTML) TIDAK pernah di-cache: data duit harus segar dan privat.
// Cuma aset statis ber-hash (/_next/static) dan ikon yang di-cache.
const V = 'catetkos-v2';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(['/logo.svg']))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const { request } = e, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (!url.pathname.startsWith('/_next/static/') && !url.pathname.startsWith('/icons/') && url.pathname !== '/logo.svg') return;
  e.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(V).then((c) => c.put(request, copy)); }
    return res;
  })));
});
