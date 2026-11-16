/* 離線支援:已載入過的內容,離線重開仍可使用(先用快取,同時在背景更新)。不收集、不上傳任何資料。 */
const CACHE = 'pf-training-3.0';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'index.html', 'config.js', 'css/app.css', 'js/app.js', 'img/f0.webp']).catch(() => { }))) });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res }).catch(() => hit);
    return hit || net;
  }));
});
