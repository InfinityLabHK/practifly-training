/* 離線支援:已載入過的內容,離線重開仍可使用。不收集、不上傳任何資料。
   v3.0.1(R04):網頁、設定檔、程式、樣式及 files/ 改為「先網絡、離線才用快取」,更新後第一次打開就是新版(包括日期);
   圖片及短片仍先用快取(背景更新)。每次發佈請改 CACHE 名稱。 */
const CACHE = 'pf-training-3.0.2';
const NET_FIRST = /(\/|\.html|\/config\.js)$|\/js\/|\/css\/|\/files\//;
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'index.html', 'config.js', 'css/app.css', 'js/app.js', 'img/f0.webp']).catch(() => { }))) });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const path = new URL(r.url).pathname;
  if (r.mode === 'navigate' || NET_FIRST.test(path)) {
    e.respondWith(caches.open(CACHE).then(async c => {
      try {
        const res = await fetch(r.mode === 'navigate' ? r : new Request(r, { cache: 'no-cache' }));
        if (res && res.ok) c.put(r, res.clone());
        return res;
      } catch (err) {
        const hit = await c.match(r, { ignoreSearch: true }); if (hit) return hit; throw err;
      }
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res }).catch(() => hit);
    return hit || net;
  }));
});
