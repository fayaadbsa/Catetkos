// Service worker minimal: shell tetap kebuka saat offline. /api TIDAK pernah di-cache (data duit harus segar).
const V = 'catetkos-v1';
const SHELL = ['/', '/logo.svg', '/manifest.webmanifest'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const { request } = e, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') { // network-first, fallback shell
    e.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(V).then((c) => c.put(request, copy)); } // aset hashed Vite aman di-cache
    return res;
  })));
});
